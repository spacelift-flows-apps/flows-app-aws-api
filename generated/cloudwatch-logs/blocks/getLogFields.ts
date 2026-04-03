import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  GetLogFieldsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getLogFields: AppBlock = {
  name: "Get Log Fields",
  description: `Discovers available fields for a specific data source and type.`,
  inputs: {
    default: {
      config: {
        region: {
          name: "Region",
          description: "AWS region for this operation",
          type: "string",
          required: true,
        },
        assumeRoleArn: {
          name: "Assume Role ARN",
          description:
            "Optional IAM role ARN to assume before executing this operation. If provided, the block will use STS to assume this role and use the temporary credentials.",
          type: "string",
          required: false,
        },
        dataSourceName: {
          name: "data Source Name",
          description:
            "The name of the data source to retrieve log fields for.",
          type: "string",
          required: true,
        },
        dataSourceType: {
          name: "data Source Type",
          description:
            "The type of the data source to retrieve log fields for.",
          type: "string",
          required: true,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        let credentials = {
          accessKeyId: input.app.config.accessKeyId,
          secretAccessKey: input.app.config.secretAccessKey,
          sessionToken: input.app.config.sessionToken,
        };

        // Determine credentials to use
        if (assumeRoleArn) {
          // Use STS to assume the specified role
          const stsClient = new STSClient({
            region: region,
            credentials: credentials,
            ...(input.app.config.endpoint && {
              endpoint: input.app.config.endpoint,
            }),
          });

          const assumeRoleCommand = new AssumeRoleCommand({
            RoleArn: assumeRoleArn,
            RoleSessionName: `flows-session-${Date.now()}`,
          });

          const assumeRoleResponse = await stsClient.send(assumeRoleCommand);
          credentials = {
            accessKeyId: assumeRoleResponse.Credentials!.AccessKeyId!,
            secretAccessKey: assumeRoleResponse.Credentials!.SecretAccessKey!,
            sessionToken: assumeRoleResponse.Credentials!.SessionToken!,
          };
        }

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetLogFieldsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Log Fields Result",
      description: "Result from GetLogFields operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          logFields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                logFieldName: {
                  type: "string",
                },
                logFieldType: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                    },
                    element: {
                      type: "object",
                      properties: {
                        type: {
                          type: "object",
                          additionalProperties: true,
                        },
                        element: {
                          type: "object",
                          additionalProperties: true,
                        },
                        fields: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    fields: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description:
              "The list of log fields for the specified data source, including field names and their data types.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getLogFields;

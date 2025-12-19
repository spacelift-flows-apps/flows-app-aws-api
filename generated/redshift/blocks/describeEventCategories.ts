import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeEventCategoriesCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeEventCategories: AppBlock = {
  name: "Describe Event Categories",
  description: `Displays a list of event categories for all event source types, or for a specified source type.`,
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
        SourceType: {
          name: "Source Type",
          description:
            "The source type, such as cluster or parameter group, to which the described event categories apply.",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
        if (assumeRoleArn) {
          // Use STS to assume the specified role
          const stsClient = new STSClient({
            region: region,
            credentials: {
              accessKeyId: input.app.config.accessKeyId,
              secretAccessKey: input.app.config.secretAccessKey,
              sessionToken: input.app.config.sessionToken,
            },
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeEventCategoriesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Event Categories Result",
      description: "Result from DescribeEventCategories operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          EventCategoriesMapList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                SourceType: {
                  type: "string",
                },
                Events: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      EventId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EventCategories: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EventDescription: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Severity: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description: "A list of event categories descriptions.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeEventCategories;

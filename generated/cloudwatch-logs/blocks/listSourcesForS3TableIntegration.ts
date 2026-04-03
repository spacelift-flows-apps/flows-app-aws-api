import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  ListSourcesForS3TableIntegrationCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listSourcesForS3TableIntegration: AppBlock = {
  name: "List Sources For S3Table Integration",
  description: `Returns a list of data source associations for a specified S3 Table Integration, showing which data sources are currently associated for query access.`,
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
        integrationArn: {
          name: "integration Arn",
          description:
            "The Amazon Resource Name (ARN) of the S3 Table Integration to list associations for.",
          type: "string",
          required: true,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of associations to return in a single call.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
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

        const command = new ListSourcesForS3TableIntegrationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Sources For S3Table Integration Result",
      description: "Result from ListSourcesForS3TableIntegration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          sources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                identifier: {
                  type: "string",
                },
                dataSource: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    type: {
                      type: "string",
                    },
                  },
                  required: ["name"],
                  additionalProperties: false,
                },
                status: {
                  type: "string",
                },
                statusReason: {
                  type: "string",
                },
                createdTimeStamp: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description:
              "The list of data source associations for the specified S3 Table Integration.",
          },
          nextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listSourcesForS3TableIntegration;

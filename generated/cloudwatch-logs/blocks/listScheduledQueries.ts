import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  ListScheduledQueriesCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listScheduledQueries: AppBlock = {
  name: "List Scheduled Queries",
  description: `Lists all scheduled queries in your account and region.`,
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
        maxResults: {
          name: "max Results",
          description: "The maximum number of scheduled queries to return.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        state: {
          name: "state",
          description: "Filter scheduled queries by state.",
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

        const command = new ListScheduledQueriesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Scheduled Queries Result",
      description: "Result from ListScheduledQueries operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          nextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
          scheduledQueries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                scheduledQueryArn: {
                  type: "string",
                },
                name: {
                  type: "string",
                },
                state: {
                  type: "string",
                },
                lastTriggeredTime: {
                  type: "number",
                },
                lastExecutionStatus: {
                  type: "string",
                },
                scheduleExpression: {
                  type: "string",
                },
                timezone: {
                  type: "string",
                },
                destinationConfiguration: {
                  type: "object",
                  properties: {
                    s3Configuration: {
                      type: "object",
                      properties: {
                        destinationIdentifier: {
                          type: "object",
                          additionalProperties: true,
                        },
                        roleArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ownerAccountId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        kmsKeyId: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["destinationIdentifier", "roleArn"],
                      additionalProperties: false,
                    },
                  },
                  required: ["s3Configuration"],
                  additionalProperties: false,
                },
                creationTime: {
                  type: "number",
                },
                lastUpdatedTime: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description: "An array of scheduled query summary information.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listScheduledQueries;

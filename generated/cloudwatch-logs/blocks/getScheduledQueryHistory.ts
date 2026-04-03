import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  GetScheduledQueryHistoryCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getScheduledQueryHistory: AppBlock = {
  name: "Get Scheduled Query History",
  description: `Retrieves the execution history of a scheduled query within a specified time range, including query results and destination processing status.`,
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
        identifier: {
          name: "identifier",
          description:
            "The ARN or name of the scheduled query to retrieve history for.",
          type: "string",
          required: true,
        },
        startTime: {
          name: "start Time",
          description:
            "The start time for the history query in Unix epoch format.",
          type: "number",
          required: true,
        },
        endTime: {
          name: "end Time",
          description:
            "The end time for the history query in Unix epoch format.",
          type: "number",
          required: true,
        },
        executionStatuses: {
          name: "execution Statuses",
          description:
            "An array of execution statuses to filter the history results.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        maxResults: {
          name: "max Results",
          description: "The maximum number of history records to return.",
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

        const command = new GetScheduledQueryHistoryCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Scheduled Query History Result",
      description: "Result from GetScheduledQueryHistory operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the scheduled query.",
          },
          scheduledQueryArn: {
            type: "string",
            description: "The ARN of the scheduled query.",
          },
          triggerHistory: {
            type: "array",
            items: {
              type: "object",
              properties: {
                queryId: {
                  type: "string",
                },
                executionStatus: {
                  type: "string",
                },
                triggeredTimestamp: {
                  type: "number",
                },
                errorMessage: {
                  type: "string",
                },
                destinations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      destinationType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      destinationIdentifier: {
                        type: "object",
                        additionalProperties: true,
                      },
                      status: {
                        type: "object",
                        additionalProperties: true,
                      },
                      processedIdentifier: {
                        type: "object",
                        additionalProperties: true,
                      },
                      errorMessage: {
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
            description:
              "An array of execution history records for the scheduled query.",
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

export default getScheduledQueryHistory;

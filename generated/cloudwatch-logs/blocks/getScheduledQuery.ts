import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  GetScheduledQueryCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getScheduledQuery: AppBlock = {
  name: "Get Scheduled Query",
  description: `Retrieves details about a specific scheduled query, including its configuration, execution status, and metadata.`,
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
          description: "The ARN or name of the scheduled query to retrieve.",
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

        const command = new GetScheduledQueryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Scheduled Query Result",
      description: "Result from GetScheduledQuery operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          scheduledQueryArn: {
            type: "string",
            description: "The ARN of the scheduled query.",
          },
          name: {
            type: "string",
            description: "The name of the scheduled query.",
          },
          description: {
            type: "string",
            description: "The description of the scheduled query.",
          },
          queryLanguage: {
            type: "string",
            description: "The query language used by the scheduled query.",
          },
          queryString: {
            type: "string",
            description: "The query string executed by the scheduled query.",
          },
          logGroupIdentifiers: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The log groups queried by the scheduled query.",
          },
          scheduleExpression: {
            type: "string",
            description:
              "The cron expression that defines when the scheduled query runs.",
          },
          timezone: {
            type: "string",
            description:
              "The timezone used for evaluating the schedule expression.",
          },
          startTimeOffset: {
            type: "number",
            description:
              "The time offset in seconds that defines the lookback period for the query.",
          },
          destinationConfiguration: {
            type: "object",
            properties: {
              s3Configuration: {
                type: "object",
                properties: {
                  destinationIdentifier: {
                    type: "string",
                  },
                  roleArn: {
                    type: "string",
                  },
                  ownerAccountId: {
                    type: "string",
                  },
                  kmsKeyId: {
                    type: "string",
                  },
                },
                required: ["destinationIdentifier", "roleArn"],
                additionalProperties: false,
              },
            },
            required: ["s3Configuration"],
            additionalProperties: false,
            description: "Configuration for where query results are delivered.",
          },
          state: {
            type: "string",
            description: "The current state of the scheduled query.",
          },
          lastTriggeredTime: {
            type: "number",
            description:
              "The timestamp when the scheduled query was last executed.",
          },
          lastExecutionStatus: {
            type: "string",
            description:
              "The status of the most recent execution of the scheduled query.",
          },
          scheduleStartTime: {
            type: "number",
            description:
              "The start time for the scheduled query in Unix epoch format.",
          },
          scheduleEndTime: {
            type: "number",
            description:
              "The end time for the scheduled query in Unix epoch format.",
          },
          executionRoleArn: {
            type: "string",
            description:
              "The ARN of the IAM role used to execute the query and deliver results.",
          },
          creationTime: {
            type: "number",
            description: "The timestamp when the scheduled query was created.",
          },
          lastUpdatedTime: {
            type: "number",
            description:
              "The timestamp when the scheduled query was last updated.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getScheduledQuery;

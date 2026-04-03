import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  UpdateScheduledQueryCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateScheduledQuery: AppBlock = {
  name: "Update Scheduled Query",
  description: `Updates an existing scheduled query with new configuration.`,
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
          description: "The ARN or name of the scheduled query to update.",
          type: "string",
          required: true,
        },
        description: {
          name: "description",
          description: "An updated description for the scheduled query.",
          type: "string",
          required: false,
        },
        queryLanguage: {
          name: "query Language",
          description: "The updated query language for the scheduled query.",
          type: "string",
          required: true,
        },
        queryString: {
          name: "query String",
          description: "The updated query string to execute.",
          type: "string",
          required: true,
        },
        logGroupIdentifiers: {
          name: "log Group Identifiers",
          description: "The updated array of log group names or ARNs to query.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        scheduleExpression: {
          name: "schedule Expression",
          description:
            "The updated cron expression that defines when the scheduled query runs.",
          type: "string",
          required: true,
        },
        timezone: {
          name: "timezone",
          description:
            "The updated timezone for evaluating the schedule expression.",
          type: "string",
          required: false,
        },
        startTimeOffset: {
          name: "start Time Offset",
          description:
            "The updated time offset in seconds that defines the lookback period for the query.",
          type: "number",
          required: false,
        },
        destinationConfiguration: {
          name: "destination Configuration",
          description:
            "The updated configuration for where to deliver query results.",
          type: {
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
          },
          required: false,
        },
        scheduleStartTime: {
          name: "schedule Start Time",
          description:
            "The updated start time for the scheduled query in Unix epoch format.",
          type: "number",
          required: false,
        },
        scheduleEndTime: {
          name: "schedule End Time",
          description:
            "The updated end time for the scheduled query in Unix epoch format.",
          type: "number",
          required: false,
        },
        executionRoleArn: {
          name: "execution Role Arn",
          description:
            "The updated ARN of the IAM role that grants permissions to execute the query and deliver results.",
          type: "string",
          required: true,
        },
        state: {
          name: "state",
          description: "The updated state of the scheduled query.",
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

        const command = new UpdateScheduledQueryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Scheduled Query Result",
      description: "Result from UpdateScheduledQuery operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          scheduledQueryArn: {
            type: "string",
            description: "The ARN of the updated scheduled query.",
          },
          name: {
            type: "string",
            description: "The name of the updated scheduled query.",
          },
          description: {
            type: "string",
            description: "The description of the updated scheduled query.",
          },
          queryLanguage: {
            type: "string",
            description: "The query language of the updated scheduled query.",
          },
          queryString: {
            type: "string",
            description: "The query string of the updated scheduled query.",
          },
          logGroupIdentifiers: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The log groups queried by the updated scheduled query.",
          },
          scheduleExpression: {
            type: "string",
            description: "The cron expression of the updated scheduled query.",
          },
          timezone: {
            type: "string",
            description: "The timezone of the updated scheduled query.",
          },
          startTimeOffset: {
            type: "number",
            description: "The time offset of the updated scheduled query.",
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
            description:
              "The destination configuration of the updated scheduled query.",
          },
          state: {
            type: "string",
            description: "The state of the updated scheduled query.",
          },
          lastTriggeredTime: {
            type: "number",
            description:
              "The timestamp when the updated scheduled query was last executed.",
          },
          lastExecutionStatus: {
            type: "string",
            description:
              "The status of the most recent execution of the updated scheduled query.",
          },
          scheduleStartTime: {
            type: "number",
            description: "The start time of the updated scheduled query.",
          },
          scheduleEndTime: {
            type: "number",
            description: "The end time of the updated scheduled query.",
          },
          executionRoleArn: {
            type: "string",
            description:
              "The execution role ARN of the updated scheduled query.",
          },
          creationTime: {
            type: "number",
            description:
              "The timestamp when the scheduled query was originally created.",
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

export default updateScheduledQuery;

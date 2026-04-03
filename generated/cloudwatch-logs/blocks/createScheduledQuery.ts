import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  CreateScheduledQueryCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createScheduledQuery: AppBlock = {
  name: "Create Scheduled Query",
  description: `Creates a scheduled query that runs CloudWatch Logs Insights queries at regular intervals.`,
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
        name: {
          name: "name",
          description: "The name of the scheduled query.",
          type: "string",
          required: true,
        },
        description: {
          name: "description",
          description:
            "An optional description for the scheduled query to help identify its purpose and functionality.",
          type: "string",
          required: false,
        },
        queryLanguage: {
          name: "query Language",
          description: "The query language to use for the scheduled query.",
          type: "string",
          required: true,
        },
        queryString: {
          name: "query String",
          description: "The query string to execute.",
          type: "string",
          required: true,
        },
        logGroupIdentifiers: {
          name: "log Group Identifiers",
          description: "An array of log group names or ARNs to query.",
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
            "A cron expression that defines when the scheduled query runs.",
          type: "string",
          required: true,
        },
        timezone: {
          name: "timezone",
          description: "The timezone for evaluating the schedule expression.",
          type: "string",
          required: false,
        },
        startTimeOffset: {
          name: "start Time Offset",
          description:
            "The time offset in seconds that defines the lookback period for the query.",
          type: "number",
          required: false,
        },
        destinationConfiguration: {
          name: "destination Configuration",
          description: "Configuration for where to deliver query results.",
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
            "The start time for the scheduled query in Unix epoch format.",
          type: "number",
          required: false,
        },
        scheduleEndTime: {
          name: "schedule End Time",
          description:
            "The end time for the scheduled query in Unix epoch format.",
          type: "number",
          required: false,
        },
        executionRoleArn: {
          name: "execution Role Arn",
          description:
            "The ARN of the IAM role that grants permissions to execute the query and deliver results to the specified destination.",
          type: "string",
          required: true,
        },
        state: {
          name: "state",
          description: "The initial state of the scheduled query.",
          type: "string",
          required: false,
        },
        tags: {
          name: "tags",
          description:
            "Key-value pairs to associate with the scheduled query for resource management and cost allocation.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
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

        const command = new CreateScheduledQueryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Scheduled Query Result",
      description: "Result from CreateScheduledQuery operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          scheduledQueryArn: {
            type: "string",
            description: "The ARN of the created scheduled query.",
          },
          state: {
            type: "string",
            description: "The current state of the scheduled query.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createScheduledQuery;

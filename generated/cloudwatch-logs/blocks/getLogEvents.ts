import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  GetLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getLogEvents: AppBlock = {
  name: "Get Log Events",
  description: `Lists log events from the specified log stream.`,
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
        logGroupName: {
          name: "log Group Name",
          description: "The name of the log group.",
          type: "string",
          required: false,
        },
        logGroupIdentifier: {
          name: "log Group Identifier",
          description:
            "Specify either the name or ARN of the log group to view events from.",
          type: "string",
          required: false,
        },
        logStreamName: {
          name: "log Stream Name",
          description: "The name of the log stream.",
          type: "string",
          required: true,
        },
        startTime: {
          name: "start Time",
          description:
            "The start of the time range, expressed as the number of milliseconds after Jan 1, 1970 00:00:00 UTC.",
          type: "number",
          required: false,
        },
        endTime: {
          name: "end Time",
          description:
            "The end of the time range, expressed as the number of milliseconds after Jan 1, 1970 00:00:00 UTC.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        limit: {
          name: "limit",
          description: "The maximum number of log events returned.",
          type: "number",
          required: false,
        },
        startFromHead: {
          name: "start From Head",
          description:
            "If the value is true, the earliest log events are returned first.",
          type: "boolean",
          required: false,
        },
        unmask: {
          name: "unmask",
          description:
            "Specify true to display the log event fields with all sensitive data unmasked and visible.",
          type: "boolean",
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

        const command = new GetLogEventsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Log Events Result",
      description: "Result from GetLogEvents operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                timestamp: {
                  type: "number",
                },
                message: {
                  type: "string",
                },
                ingestionTime: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description: "The events.",
          },
          nextForwardToken: {
            type: "string",
            description:
              "The token for the next set of items in the forward direction.",
          },
          nextBackwardToken: {
            type: "string",
            description:
              "The token for the next set of items in the backward direction.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getLogEvents;

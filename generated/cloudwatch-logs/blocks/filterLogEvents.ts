import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const filterLogEvents: AppBlock = {
  name: "Filter Log Events",
  description: `Lists log events from the specified log group.`,
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
          description: "The name of the log group to search.",
          type: "string",
          required: false,
        },
        logGroupIdentifier: {
          name: "log Group Identifier",
          description:
            "Specify either the name or ARN of the log group to view log events from.",
          type: "string",
          required: false,
        },
        logStreamNames: {
          name: "log Stream Names",
          description:
            "Filters the results to only logs from the log streams in this list.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        logStreamNamePrefix: {
          name: "log Stream Name Prefix",
          description:
            "Filters the results to include only events from log streams that have names starting with this prefix.",
          type: "string",
          required: false,
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
        filterPattern: {
          name: "filter Pattern",
          description: "The filter pattern to use.",
          type: "string",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "The token for the next set of events to return.",
          type: "string",
          required: false,
        },
        limit: {
          name: "limit",
          description: "The maximum number of events to return.",
          type: "number",
          required: false,
        },
        interleaved: {
          name: "interleaved",
          description:
            "If the value is true, the operation attempts to provide responses that contain events from multiple log streams within the log group, interleaved in a single response.",
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

        const command = new FilterLogEventsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Filter Log Events Result",
      description: "Result from FilterLogEvents operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                logStreamName: {
                  type: "string",
                },
                timestamp: {
                  type: "number",
                },
                message: {
                  type: "string",
                },
                ingestionTime: {
                  type: "number",
                },
                eventId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The matched events.",
          },
          searchedLogStreams: {
            type: "array",
            items: {
              type: "object",
              properties: {
                logStreamName: {
                  type: "string",
                },
                searchedCompletely: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
            description:
              "Important As of May 15, 2020, this parameter is no longer supported.",
          },
          nextToken: {
            type: "string",
            description:
              "The token to use when requesting the next set of items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default filterLogEvents;

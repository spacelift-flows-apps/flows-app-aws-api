import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  DescribeAlarmHistoryCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAlarmHistory: AppBlock = {
  name: "Describe Alarm History",
  description: `Retrieves the history for the specified alarm.`,
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
        AlarmName: {
          name: "Alarm Name",
          description: "The name of the alarm.",
          type: "string",
          required: false,
        },
        AlarmTypes: {
          name: "Alarm Types",
          description:
            "Use this parameter to specify whether you want the operation to return metric alarms or composite alarms.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        HistoryItemType: {
          name: "History Item Type",
          description: "The type of alarm histories to retrieve.",
          type: "string",
          required: false,
        },
        StartDate: {
          name: "Start Date",
          description: "The starting date to retrieve alarm history.",
          type: "string",
          required: false,
        },
        EndDate: {
          name: "End Date",
          description: "The ending date to retrieve alarm history.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of alarm history records to retrieve.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The token returned by a previous call to indicate that there is more data available.",
          type: "string",
          required: false,
        },
        ScanBy: {
          name: "Scan By",
          description:
            "Specified whether to return the newest or oldest alarm history first.",
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

        const client = new CloudWatchClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeAlarmHistoryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Alarm History Result",
      description: "Result from DescribeAlarmHistory operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AlarmHistoryItems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AlarmName: {
                  type: "string",
                },
                AlarmType: {
                  type: "string",
                },
                Timestamp: {
                  type: "string",
                },
                HistoryItemType: {
                  type: "string",
                },
                HistorySummary: {
                  type: "string",
                },
                HistoryData: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The alarm histories, in JSON format.",
          },
          NextToken: {
            type: "string",
            description:
              "The token that marks the start of the next batch of returned results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeAlarmHistory;

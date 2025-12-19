import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAlarms: AppBlock = {
  name: "Describe Alarms",
  description: `Retrieves the specified alarms.`,
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
        AlarmNames: {
          name: "Alarm Names",
          description: "The names of the alarms to retrieve information about.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AlarmNamePrefix: {
          name: "Alarm Name Prefix",
          description: "An alarm name prefix.",
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
        ChildrenOfAlarmName: {
          name: "Children Of Alarm Name",
          description:
            'If you use this parameter and specify the name of a composite alarm, the operation returns information about the "children" alarms of the alarm you specify.',
          type: "string",
          required: false,
        },
        ParentsOfAlarmName: {
          name: "Parents Of Alarm Name",
          description:
            'If you use this parameter and specify the name of a metric or composite alarm, the operation returns information about the "parent" alarms of the alarm you specify.',
          type: "string",
          required: false,
        },
        StateValue: {
          name: "State Value",
          description:
            "Specify this parameter to receive information only about alarms that are currently in the state that you specify.",
          type: "string",
          required: false,
        },
        ActionPrefix: {
          name: "Action Prefix",
          description:
            "Use this parameter to filter the results of the operation to only those alarms that use a certain alarm action.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description: "The maximum number of alarm descriptions to retrieve.",
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

        const command = new DescribeAlarmsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Alarms Result",
      description: "Result from DescribeAlarms operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CompositeAlarms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ActionsEnabled: {
                  type: "boolean",
                },
                AlarmActions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                AlarmArn: {
                  type: "string",
                },
                AlarmConfigurationUpdatedTimestamp: {
                  type: "string",
                },
                AlarmDescription: {
                  type: "string",
                },
                AlarmName: {
                  type: "string",
                },
                AlarmRule: {
                  type: "string",
                },
                InsufficientDataActions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                OKActions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                StateReason: {
                  type: "string",
                },
                StateReasonData: {
                  type: "string",
                },
                StateUpdatedTimestamp: {
                  type: "string",
                },
                StateValue: {
                  type: "string",
                },
                StateTransitionedTimestamp: {
                  type: "string",
                },
                ActionsSuppressedBy: {
                  type: "string",
                },
                ActionsSuppressedReason: {
                  type: "string",
                },
                ActionsSuppressor: {
                  type: "string",
                },
                ActionsSuppressorWaitPeriod: {
                  type: "number",
                },
                ActionsSuppressorExtensionPeriod: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description:
              "The information about any composite alarms returned by the operation.",
          },
          MetricAlarms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AlarmName: {
                  type: "string",
                },
                AlarmArn: {
                  type: "string",
                },
                AlarmDescription: {
                  type: "string",
                },
                AlarmConfigurationUpdatedTimestamp: {
                  type: "string",
                },
                ActionsEnabled: {
                  type: "boolean",
                },
                OKActions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                AlarmActions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                InsufficientDataActions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                StateValue: {
                  type: "string",
                },
                StateReason: {
                  type: "string",
                },
                StateReasonData: {
                  type: "string",
                },
                StateUpdatedTimestamp: {
                  type: "string",
                },
                MetricName: {
                  type: "string",
                },
                Namespace: {
                  type: "string",
                },
                Statistic: {
                  type: "string",
                },
                ExtendedStatistic: {
                  type: "string",
                },
                Dimensions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Name", "Value"],
                    additionalProperties: false,
                  },
                },
                Period: {
                  type: "number",
                },
                Unit: {
                  type: "string",
                },
                EvaluationPeriods: {
                  type: "number",
                },
                DatapointsToAlarm: {
                  type: "number",
                },
                Threshold: {
                  type: "number",
                },
                ComparisonOperator: {
                  type: "string",
                },
                TreatMissingData: {
                  type: "string",
                },
                EvaluateLowSampleCountPercentile: {
                  type: "string",
                },
                Metrics: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Id: {
                        type: "object",
                        additionalProperties: true,
                      },
                      MetricStat: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Expression: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Label: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ReturnData: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Period: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AccountId: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Id"],
                    additionalProperties: false,
                  },
                },
                ThresholdMetricId: {
                  type: "string",
                },
                EvaluationState: {
                  type: "string",
                },
                StateTransitionedTimestamp: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "The information about any metric alarms returned by the operation.",
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

export default describeAlarms;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  DescribeAlarmsForMetricCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAlarmsForMetric: AppBlock = {
  name: "Describe Alarms For Metric",
  description: `Retrieves the alarms for the specified metric.`,
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
        MetricName: {
          name: "Metric Name",
          description: "The name of the metric.",
          type: "string",
          required: true,
        },
        Namespace: {
          name: "Namespace",
          description: "The namespace of the metric.",
          type: "string",
          required: true,
        },
        Statistic: {
          name: "Statistic",
          description: "The statistic for the metric, other than percentiles.",
          type: "string",
          required: false,
        },
        ExtendedStatistic: {
          name: "Extended Statistic",
          description: "The percentile statistic for the metric.",
          type: "string",
          required: false,
        },
        Dimensions: {
          name: "Dimensions",
          description: "The dimensions associated with the metric.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              required: ["Name", "Value"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Period: {
          name: "Period",
          description:
            "The period, in seconds, over which the statistic is applied.",
          type: "number",
          required: false,
        },
        Unit: {
          name: "Unit",
          description: "The unit for the metric.",
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

        const client = new CloudWatchClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeAlarmsForMetricCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Alarms For Metric Result",
      description: "Result from DescribeAlarmsForMetric operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
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
              "The information for each alarm with the specified metric.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeAlarmsForMetric;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  PutMetricAlarmCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putMetricAlarm: AppBlock = {
  name: "Put Metric Alarm",
  description: `Creates or updates an alarm and associates it with the specified metric, metric math expression, anomaly detection model, or Metrics Insights query.`,
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
          description: "The name for the alarm.",
          type: "string",
          required: true,
        },
        AlarmDescription: {
          name: "Alarm Description",
          description: "The description for the alarm.",
          type: "string",
          required: false,
        },
        ActionsEnabled: {
          name: "Actions Enabled",
          description:
            "Indicates whether actions should be executed during any changes to the alarm state.",
          type: "boolean",
          required: false,
        },
        OKActions: {
          name: "OK Actions",
          description:
            "The actions to execute when this alarm transitions to an OK state from any other state.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AlarmActions: {
          name: "Alarm Actions",
          description:
            "The actions to execute when this alarm transitions to the ALARM state from any other state.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        InsufficientDataActions: {
          name: "Insufficient Data Actions",
          description:
            "The actions to execute when this alarm transitions to the INSUFFICIENT_DATA state from any other state.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        MetricName: {
          name: "Metric Name",
          description: "The name for the metric associated with the alarm.",
          type: "string",
          required: false,
        },
        Namespace: {
          name: "Namespace",
          description:
            "The namespace for the metric associated specified in MetricName.",
          type: "string",
          required: false,
        },
        Statistic: {
          name: "Statistic",
          description:
            "The statistic for the metric specified in MetricName, other than percentile.",
          type: "string",
          required: false,
        },
        ExtendedStatistic: {
          name: "Extended Statistic",
          description:
            "The extended statistic for the metric specified in MetricName.",
          type: "string",
          required: false,
        },
        Dimensions: {
          name: "Dimensions",
          description: "The dimensions for the metric specified in MetricName.",
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
            "The length, in seconds, used each time the metric specified in MetricName is evaluated.",
          type: "number",
          required: false,
        },
        Unit: {
          name: "Unit",
          description: "The unit of measure for the statistic.",
          type: "string",
          required: false,
        },
        EvaluationPeriods: {
          name: "Evaluation Periods",
          description:
            "The number of periods over which data is compared to the specified threshold.",
          type: "number",
          required: true,
        },
        DatapointsToAlarm: {
          name: "Datapoints To Alarm",
          description:
            "The number of data points that must be breaching to trigger the alarm.",
          type: "number",
          required: false,
        },
        Threshold: {
          name: "Threshold",
          description:
            "The value against which the specified statistic is compared.",
          type: "number",
          required: false,
        },
        ComparisonOperator: {
          name: "Comparison Operator",
          description:
            "The arithmetic operation to use when comparing the specified statistic and threshold.",
          type: "string",
          required: true,
        },
        TreatMissingData: {
          name: "Treat Missing Data",
          description: "Sets how this alarm is to handle missing data points.",
          type: "string",
          required: false,
        },
        EvaluateLowSampleCountPercentile: {
          name: "Evaluate Low Sample Count Percentile",
          description: "Used only for alarms based on percentiles.",
          type: "string",
          required: false,
        },
        Metrics: {
          name: "Metrics",
          description:
            "An array of MetricDataQuery structures that enable you to create an alarm based on the result of a metric math expression.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                MetricStat: {
                  type: "object",
                  properties: {
                    Metric: {
                      type: "object",
                      properties: {
                        Namespace: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MetricName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Dimensions: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    Period: {
                      type: "number",
                    },
                    Stat: {
                      type: "string",
                    },
                    Unit: {
                      type: "string",
                    },
                  },
                  required: ["Metric", "Period", "Stat"],
                  additionalProperties: false,
                },
                Expression: {
                  type: "string",
                },
                Label: {
                  type: "string",
                },
                ReturnData: {
                  type: "boolean",
                },
                Period: {
                  type: "number",
                },
                AccountId: {
                  type: "string",
                },
              },
              required: ["Id"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "A list of key-value pairs to associate with the alarm.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              required: ["Key", "Value"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        ThresholdMetricId: {
          name: "Threshold Metric Id",
          description:
            "If this is an alarm based on an anomaly detection model, make this value match the ID of the ANOMALY_DETECTION_BAND function.",
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
        }

        const client = new CloudWatchClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutMetricAlarmCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Metric Alarm Result",
      description: "Result from PutMetricAlarm operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default putMetricAlarm;

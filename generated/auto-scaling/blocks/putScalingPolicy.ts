import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  PutScalingPolicyCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putScalingPolicy: AppBlock = {
  name: "Put Scaling Policy",
  description: `Creates or updates a scaling policy for an Auto Scaling group.`,
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
        AutoScalingGroupName: {
          name: "Auto Scaling Group Name",
          description: "The name of the Auto Scaling group.",
          type: "string",
          required: true,
        },
        PolicyName: {
          name: "Policy Name",
          description: "The name of the policy.",
          type: "string",
          required: true,
        },
        PolicyType: {
          name: "Policy Type",
          description:
            "One of the following policy types: TargetTrackingScaling StepScaling SimpleScaling (default) Predict...",
          type: "string",
          required: false,
        },
        AdjustmentType: {
          name: "Adjustment Type",
          description:
            "Specifies how the scaling adjustment is interpreted (for example, an absolute number or a percentage).",
          type: "string",
          required: false,
        },
        MinAdjustmentStep: {
          name: "Min Adjustment Step",
          description: "Available for backward compatibility.",
          type: "number",
          required: false,
        },
        MinAdjustmentMagnitude: {
          name: "Min Adjustment Magnitude",
          description:
            "The minimum value to scale by when the adjustment type is PercentChangeInCapacity.",
          type: "number",
          required: false,
        },
        ScalingAdjustment: {
          name: "Scaling Adjustment",
          description:
            "The amount by which to scale, based on the specified adjustment type.",
          type: "number",
          required: false,
        },
        Cooldown: {
          name: "Cooldown",
          description:
            "A cooldown period, in seconds, that applies to a specific simple scaling policy.",
          type: "number",
          required: false,
        },
        MetricAggregationType: {
          name: "Metric Aggregation Type",
          description: "The aggregation type for the CloudWatch metrics.",
          type: "string",
          required: false,
        },
        StepAdjustments: {
          name: "Step Adjustments",
          description:
            "A set of adjustments that enable you to scale based on the size of the alarm breach.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                MetricIntervalLowerBound: {
                  type: "number",
                },
                MetricIntervalUpperBound: {
                  type: "number",
                },
                ScalingAdjustment: {
                  type: "number",
                },
              },
              required: ["ScalingAdjustment"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        EstimatedInstanceWarmup: {
          name: "Estimated Instance Warmup",
          description:
            "Not needed if the default instance warmup is defined for the group.",
          type: "number",
          required: false,
        },
        TargetTrackingConfiguration: {
          name: "Target Tracking Configuration",
          description: "A target tracking scaling policy.",
          type: {
            type: "object",
            properties: {
              PredefinedMetricSpecification: {
                type: "object",
                properties: {
                  PredefinedMetricType: {
                    type: "string",
                  },
                  ResourceLabel: {
                    type: "string",
                  },
                },
                required: ["PredefinedMetricType"],
                additionalProperties: false,
              },
              CustomizedMetricSpecification: {
                type: "object",
                properties: {
                  MetricName: {
                    type: "string",
                  },
                  Namespace: {
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
                  Statistic: {
                    type: "string",
                  },
                  Unit: {
                    type: "string",
                  },
                  Period: {
                    type: "number",
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
                        Expression: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MetricStat: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Label: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Period: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ReturnData: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Id"],
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
              TargetValue: {
                type: "number",
              },
              DisableScaleIn: {
                type: "boolean",
              },
            },
            required: ["TargetValue"],
            additionalProperties: false,
          },
          required: false,
        },
        Enabled: {
          name: "Enabled",
          description:
            "Indicates whether the scaling policy is enabled or disabled.",
          type: "boolean",
          required: false,
        },
        PredictiveScalingConfiguration: {
          name: "Predictive Scaling Configuration",
          description: "A predictive scaling policy.",
          type: {
            type: "object",
            properties: {
              MetricSpecifications: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    TargetValue: {
                      type: "number",
                    },
                    PredefinedMetricPairSpecification: {
                      type: "object",
                      properties: {
                        PredefinedMetricType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ResourceLabel: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["PredefinedMetricType"],
                      additionalProperties: false,
                    },
                    PredefinedScalingMetricSpecification: {
                      type: "object",
                      properties: {
                        PredefinedMetricType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ResourceLabel: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["PredefinedMetricType"],
                      additionalProperties: false,
                    },
                    PredefinedLoadMetricSpecification: {
                      type: "object",
                      properties: {
                        PredefinedMetricType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ResourceLabel: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["PredefinedMetricType"],
                      additionalProperties: false,
                    },
                    CustomizedScalingMetricSpecification: {
                      type: "object",
                      properties: {
                        MetricDataQueries: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["MetricDataQueries"],
                      additionalProperties: false,
                    },
                    CustomizedLoadMetricSpecification: {
                      type: "object",
                      properties: {
                        MetricDataQueries: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["MetricDataQueries"],
                      additionalProperties: false,
                    },
                    CustomizedCapacityMetricSpecification: {
                      type: "object",
                      properties: {
                        MetricDataQueries: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["MetricDataQueries"],
                      additionalProperties: false,
                    },
                  },
                  required: ["TargetValue"],
                  additionalProperties: false,
                },
              },
              Mode: {
                type: "string",
              },
              SchedulingBufferTime: {
                type: "number",
              },
              MaxCapacityBreachBehavior: {
                type: "string",
              },
              MaxCapacityBuffer: {
                type: "number",
              },
            },
            required: ["MetricSpecifications"],
            additionalProperties: false,
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

        const client = new AutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutScalingPolicyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Scaling Policy Result",
      description: "Result from PutScalingPolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          PolicyARN: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the policy.",
          },
          Alarms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AlarmName: {
                  type: "string",
                },
                AlarmARN: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "The CloudWatch alarms created for the target tracking scaling policy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putScalingPolicy;

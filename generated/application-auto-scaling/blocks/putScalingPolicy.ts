import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ApplicationAutoScalingClient,
  PutScalingPolicyCommand,
} from "@aws-sdk/client-application-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putScalingPolicy: AppBlock = {
  name: "Put Scaling Policy",
  description: `Creates or updates a scaling policy for an Application Auto Scaling scalable target.`,
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
        PolicyName: {
          name: "Policy Name",
          description: "The name of the scaling policy.",
          type: "string",
          required: true,
        },
        ServiceNamespace: {
          name: "Service Namespace",
          description:
            "The namespace of the Amazon Web Services service that provides the resource.",
          type: "string",
          required: true,
        },
        ResourceId: {
          name: "Resource Id",
          description:
            "The identifier of the resource associated with the scaling policy.",
          type: "string",
          required: true,
        },
        ScalableDimension: {
          name: "Scalable Dimension",
          description: "The scalable dimension.",
          type: "string",
          required: true,
        },
        PolicyType: {
          name: "Policy Type",
          description: "The scaling policy type.",
          type: "string",
          required: false,
        },
        StepScalingPolicyConfiguration: {
          name: "Step Scaling Policy Configuration",
          description: "A step scaling policy.",
          type: {
            type: "object",
            properties: {
              AdjustmentType: {
                type: "string",
              },
              StepAdjustments: {
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
              MinAdjustmentMagnitude: {
                type: "number",
              },
              Cooldown: {
                type: "number",
              },
              MetricAggregationType: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        TargetTrackingScalingPolicyConfiguration: {
          name: "Target Tracking Scaling Policy Configuration",
          description: "A target tracking scaling policy.",
          type: {
            type: "object",
            properties: {
              TargetValue: {
                type: "number",
              },
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
                  Metrics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Expression: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Id: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Label: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MetricStat: {
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
              ScaleOutCooldown: {
                type: "number",
              },
              ScaleInCooldown: {
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
        PredictiveScalingPolicyConfiguration: {
          name: "Predictive Scaling Policy Configuration",
          description: "The configuration of the predictive scaling policy.",
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

        const client = new ApplicationAutoScalingClient({
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
            description:
              "The Amazon Resource Name (ARN) of the resulting scaling policy.",
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
              required: ["AlarmName", "AlarmARN"],
              additionalProperties: false,
            },
            description:
              "The CloudWatch alarms created for the target tracking scaling policy.",
          },
        },
        required: ["PolicyARN"],
      },
    },
  },
};

export default putScalingPolicy;

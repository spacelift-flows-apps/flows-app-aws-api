import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  DescribePoliciesCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describePolicies: AppBlock = {
  name: "Describe Policies",
  description: `Gets information about the scaling policies in the account and Region.`,
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
          required: false,
        },
        PolicyNames: {
          name: "Policy Names",
          description: "The names of one or more policies.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        PolicyTypes: {
          name: "Policy Types",
          description: "One or more policy types.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of items to be returned with each call.",
          type: "number",
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

        const command = new DescribePoliciesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Policies Result",
      description: "Result from DescribePolicies operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ScalingPolicies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AutoScalingGroupName: {
                  type: "string",
                },
                PolicyName: {
                  type: "string",
                },
                PolicyARN: {
                  type: "string",
                },
                PolicyType: {
                  type: "string",
                },
                AdjustmentType: {
                  type: "string",
                },
                MinAdjustmentStep: {
                  type: "number",
                },
                MinAdjustmentMagnitude: {
                  type: "number",
                },
                ScalingAdjustment: {
                  type: "number",
                },
                Cooldown: {
                  type: "number",
                },
                StepAdjustments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      MetricIntervalLowerBound: {
                        type: "object",
                        additionalProperties: true,
                      },
                      MetricIntervalUpperBound: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ScalingAdjustment: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["ScalingAdjustment"],
                    additionalProperties: false,
                  },
                },
                MetricAggregationType: {
                  type: "string",
                },
                EstimatedInstanceWarmup: {
                  type: "number",
                },
                Alarms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      AlarmName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AlarmARN: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                TargetTrackingConfiguration: {
                  type: "object",
                  properties: {
                    PredefinedMetricSpecification: {
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
                    CustomizedMetricSpecification: {
                      type: "object",
                      properties: {
                        MetricName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Namespace: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Dimensions: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Statistic: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Unit: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Period: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Metrics: {
                          type: "object",
                          additionalProperties: true,
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
                Enabled: {
                  type: "boolean",
                },
                PredictiveScalingConfiguration: {
                  type: "object",
                  properties: {
                    MetricSpecifications: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
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
              },
              additionalProperties: false,
            },
            description: "The scaling policies.",
          },
          NextToken: {
            type: "string",
            description:
              "A string that indicates that the response contains more items than can be returned in a single response.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describePolicies;

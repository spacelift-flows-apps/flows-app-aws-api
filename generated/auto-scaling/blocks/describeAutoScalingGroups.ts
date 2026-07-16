import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAutoScalingGroups: AppBlock = {
  name: "Describe Auto Scaling Groups",
  description: `Gets information about the Auto Scaling groups in the account and Region.`,
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
        AutoScalingGroupNames: {
          name: "Auto Scaling Group Names",
          description: "The names of the Auto Scaling groups.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        IncludeInstances: {
          name: "Include Instances",
          description:
            "Specifies whether to include information about Amazon EC2 instances in the response.",
          type: "boolean",
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
          description: "The maximum number of items to return with this call.",
          type: "number",
          required: false,
        },
        Filters: {
          name: "Filters",
          description:
            "One or more filters to limit the results based on specific tags.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
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

        const client = new AutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeAutoScalingGroupsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Auto Scaling Groups Result",
      description: "Result from DescribeAutoScalingGroups operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AutoScalingGroups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AutoScalingGroupName: {
                  type: "string",
                },
                AutoScalingGroupARN: {
                  type: "string",
                },
                LaunchConfigurationName: {
                  type: "string",
                },
                LaunchTemplate: {
                  type: "object",
                  properties: {
                    LaunchTemplateId: {
                      type: "string",
                    },
                    LaunchTemplateName: {
                      type: "string",
                    },
                    Version: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                MixedInstancesPolicy: {
                  type: "object",
                  properties: {
                    LaunchTemplate: {
                      type: "object",
                      properties: {
                        LaunchTemplateSpecification: {
                          type: "object",
                          properties: {
                            LaunchTemplateId: {},
                            LaunchTemplateName: {},
                            Version: {},
                          },
                          additionalProperties: false,
                        },
                        Overrides: {
                          type: "array",
                          items: {},
                        },
                      },
                      additionalProperties: false,
                    },
                    InstancesDistribution: {
                      type: "object",
                      properties: {
                        OnDemandAllocationStrategy: {
                          type: "string",
                        },
                        OnDemandBaseCapacity: {
                          type: "number",
                        },
                        OnDemandPercentageAboveBaseCapacity: {
                          type: "number",
                        },
                        SpotAllocationStrategy: {
                          type: "string",
                        },
                        SpotInstancePools: {
                          type: "number",
                        },
                        SpotMaxPrice: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                MinSize: {
                  type: "number",
                },
                MaxSize: {
                  type: "number",
                },
                DesiredCapacity: {
                  type: "number",
                },
                PredictedCapacity: {
                  type: "number",
                },
                DefaultCooldown: {
                  type: "number",
                },
                AvailabilityZones: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                AvailabilityZoneIds: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                LoadBalancerNames: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                TargetGroupARNs: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                HealthCheckType: {
                  type: "string",
                },
                HealthCheckGracePeriod: {
                  type: "number",
                },
                Instances: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      InstanceId: {
                        type: "string",
                      },
                      InstanceType: {
                        type: "string",
                      },
                      AvailabilityZone: {
                        type: "string",
                      },
                      AvailabilityZoneId: {
                        type: "string",
                      },
                      LifecycleState: {
                        type: "string",
                      },
                      HealthStatus: {
                        type: "string",
                      },
                      LaunchConfigurationName: {
                        type: "string",
                      },
                      LaunchTemplate: {
                        type: "object",
                        properties: {
                          LaunchTemplateId: {},
                          LaunchTemplateName: {},
                          Version: {},
                        },
                        additionalProperties: false,
                      },
                      ImageId: {
                        type: "string",
                      },
                      ProtectedFromScaleIn: {
                        type: "boolean",
                      },
                      WeightedCapacity: {
                        type: "string",
                      },
                    },
                    required: [
                      "InstanceId",
                      "AvailabilityZone",
                      "LifecycleState",
                      "HealthStatus",
                      "ProtectedFromScaleIn",
                    ],
                    additionalProperties: false,
                  },
                },
                CreatedTime: {
                  type: "string",
                },
                SuspendedProcesses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ProcessName: {
                        type: "string",
                      },
                      SuspensionReason: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                PlacementGroup: {
                  type: "string",
                },
                VPCZoneIdentifier: {
                  type: "string",
                },
                EnabledMetrics: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Metric: {
                        type: "string",
                      },
                      Granularity: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                Status: {
                  type: "string",
                },
                Tags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ResourceId: {
                        type: "string",
                      },
                      ResourceType: {
                        type: "string",
                      },
                      Key: {
                        type: "string",
                      },
                      Value: {
                        type: "string",
                      },
                      PropagateAtLaunch: {
                        type: "boolean",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                TerminationPolicies: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                NewInstancesProtectedFromScaleIn: {
                  type: "boolean",
                },
                ServiceLinkedRoleARN: {
                  type: "string",
                },
                MaxInstanceLifetime: {
                  type: "number",
                },
                CapacityRebalance: {
                  type: "boolean",
                },
                WarmPoolConfiguration: {
                  type: "object",
                  properties: {
                    MaxGroupPreparedCapacity: {
                      type: "number",
                    },
                    MinSize: {
                      type: "number",
                    },
                    PoolState: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                    InstanceReusePolicy: {
                      type: "object",
                      properties: {
                        ReuseOnScaleIn: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                WarmPoolSize: {
                  type: "number",
                },
                Context: {
                  type: "string",
                },
                DesiredCapacityType: {
                  type: "string",
                },
                DefaultInstanceWarmup: {
                  type: "number",
                },
                TrafficSources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Identifier: {
                        type: "string",
                      },
                      Type: {
                        type: "string",
                      },
                    },
                    required: ["Identifier"],
                    additionalProperties: false,
                  },
                },
                InstanceMaintenancePolicy: {
                  type: "object",
                  properties: {
                    MinHealthyPercentage: {
                      type: "number",
                    },
                    MaxHealthyPercentage: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                DeletionProtection: {
                  type: "string",
                },
                AvailabilityZoneDistribution: {
                  type: "object",
                  properties: {
                    CapacityDistributionStrategy: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                AvailabilityZoneImpairmentPolicy: {
                  type: "object",
                  properties: {
                    ZonalShiftEnabled: {
                      type: "boolean",
                    },
                    ImpairedZoneHealthCheckBehavior: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                CapacityReservationSpecification: {
                  type: "object",
                  properties: {
                    CapacityReservationPreference: {
                      type: "string",
                    },
                    CapacityReservationTarget: {
                      type: "object",
                      properties: {
                        CapacityReservationIds: {
                          type: "array",
                          items: {},
                        },
                        CapacityReservationResourceGroupArns: {
                          type: "array",
                          items: {},
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                InstanceLifecyclePolicy: {
                  type: "object",
                  properties: {
                    RetentionTriggers: {
                      type: "object",
                      properties: {
                        TerminateHookAbandon: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: [
                "AutoScalingGroupName",
                "MinSize",
                "MaxSize",
                "DesiredCapacity",
                "DefaultCooldown",
                "AvailabilityZones",
                "HealthCheckType",
                "CreatedTime",
              ],
              additionalProperties: false,
            },
            description: "The groups.",
          },
          NextToken: {
            type: "string",
            description:
              "A string that indicates that the response contains more items than can be returned in a single response.",
          },
        },
        required: ["AutoScalingGroups"],
      },
    },
  },
};

export default describeAutoScalingGroups;

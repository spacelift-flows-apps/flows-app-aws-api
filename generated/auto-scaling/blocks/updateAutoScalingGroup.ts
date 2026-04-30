import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  UpdateAutoScalingGroupCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateAutoScalingGroup: AppBlock = {
  name: "Update Auto Scaling Group",
  description: `We strongly recommend that all Auto Scaling groups use launch templates to ensure full functionality for Amazon EC2 Auto Scaling and Amazon EC2.`,
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
        LaunchConfigurationName: {
          name: "Launch Configuration Name",
          description: "The name of the launch configuration.",
          type: "string",
          required: false,
        },
        LaunchTemplate: {
          name: "Launch Template",
          description:
            "The launch template and version to use to specify the updates.",
          type: {
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
          required: false,
        },
        MixedInstancesPolicy: {
          name: "Mixed Instances Policy",
          description: "The mixed instances policy.",
          type: {
            type: "object",
            properties: {
              LaunchTemplate: {
                type: "object",
                properties: {
                  LaunchTemplateSpecification: {
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
                  Overrides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        InstanceType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        WeightedCapacity: {
                          type: "object",
                          additionalProperties: true,
                        },
                        LaunchTemplateSpecification: {
                          type: "object",
                          additionalProperties: true,
                        },
                        InstanceRequirements: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ImageId: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
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
          required: false,
        },
        MinSize: {
          name: "Min Size",
          description: "The minimum size of the Auto Scaling group.",
          type: "number",
          required: false,
        },
        MaxSize: {
          name: "Max Size",
          description: "The maximum size of the Auto Scaling group.",
          type: "number",
          required: false,
        },
        DesiredCapacity: {
          name: "Desired Capacity",
          description:
            "The desired capacity is the initial capacity of the Auto Scaling group after this operation completes and the capacity it attempts to maintain.",
          type: "number",
          required: false,
        },
        DefaultCooldown: {
          name: "Default Cooldown",
          description: "Only needed if you use simple scaling policies.",
          type: "number",
          required: false,
        },
        AvailabilityZones: {
          name: "Availability Zones",
          description: "One or more Availability Zones for the group.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AvailabilityZoneIds: {
          name: "Availability Zone Ids",
          description:
            "A list of Availability Zone IDs for the Auto Scaling group.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        HealthCheckType: {
          name: "Health Check Type",
          description:
            "A comma-separated value string of one or more health check types.",
          type: "string",
          required: false,
        },
        HealthCheckGracePeriod: {
          name: "Health Check Grace Period",
          description:
            "The amount of time, in seconds, that Amazon EC2 Auto Scaling waits before checking the health status of an EC2 instance that has come into service and marking it unhealthy due to a failed health check.",
          type: "number",
          required: false,
        },
        PlacementGroup: {
          name: "Placement Group",
          description:
            "The name of an existing placement group into which to launch your instances.",
          type: "string",
          required: false,
        },
        VPCZoneIdentifier: {
          name: "VPC Zone Identifier",
          description:
            "A comma-separated list of subnet IDs for a virtual private cloud (VPC).",
          type: "string",
          required: false,
        },
        TerminationPolicies: {
          name: "Termination Policies",
          description:
            "A policy or a list of policies that are used to select the instances to terminate.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        NewInstancesProtectedFromScaleIn: {
          name: "New Instances Protected From Scale In",
          description:
            "Indicates whether newly launched instances are protected from termination by Amazon EC2 Auto Scaling when scaling in.",
          type: "boolean",
          required: false,
        },
        ServiceLinkedRoleARN: {
          name: "Service Linked Role ARN",
          description:
            "The Amazon Resource Name (ARN) of the service-linked role that the Auto Scaling group uses to call other Amazon Web Services on your behalf.",
          type: "string",
          required: false,
        },
        MaxInstanceLifetime: {
          name: "Max Instance Lifetime",
          description:
            "The maximum amount of time, in seconds, that an instance can be in service.",
          type: "number",
          required: false,
        },
        CapacityRebalance: {
          name: "Capacity Rebalance",
          description: "Enables or disables Capacity Rebalancing.",
          type: "boolean",
          required: false,
        },
        Context: {
          name: "Context",
          description: "Reserved.",
          type: "string",
          required: false,
        },
        DesiredCapacityType: {
          name: "Desired Capacity Type",
          description:
            "The unit of measurement for the value specified for desired capacity.",
          type: "string",
          required: false,
        },
        DefaultInstanceWarmup: {
          name: "Default Instance Warmup",
          description:
            "The amount of time, in seconds, until a new instance is considered to have finished initializing and resource consumption to become stable after it enters the InService state.",
          type: "number",
          required: false,
        },
        InstanceMaintenancePolicy: {
          name: "Instance Maintenance Policy",
          description: "An instance maintenance policy.",
          type: {
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
          required: false,
        },
        AvailabilityZoneDistribution: {
          name: "Availability Zone Distribution",
          description:
            "The instance capacity distribution across Availability Zones.",
          type: {
            type: "object",
            properties: {
              CapacityDistributionStrategy: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        AvailabilityZoneImpairmentPolicy: {
          name: "Availability Zone Impairment Policy",
          description: "The policy for Availability Zone impairment.",
          type: {
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
          required: false,
        },
        SkipZonalShiftValidation: {
          name: "Skip Zonal Shift Validation",
          description:
            "If you enable zonal shift with cross-zone disabled load balancers, capacity could become imbalanced across Availability Zones.",
          type: "boolean",
          required: false,
        },
        CapacityReservationSpecification: {
          name: "Capacity Reservation Specification",
          description:
            "The capacity reservation specification for the Auto Scaling group.",
          type: {
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
                    items: {
                      type: "string",
                    },
                  },
                  CapacityReservationResourceGroupArns: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        InstanceLifecyclePolicy: {
          name: "Instance Lifecycle Policy",
          description:
            "The instance lifecycle policy for the Auto Scaling group.",
          type: {
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
          required: false,
        },
        DeletionProtection: {
          name: "Deletion Protection",
          description:
            "The deletion protection setting for the Auto Scaling group.",
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

        const client = new AutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateAutoScalingGroupCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Auto Scaling Group Result",
      description: "Result from UpdateAutoScalingGroup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default updateAutoScalingGroup;

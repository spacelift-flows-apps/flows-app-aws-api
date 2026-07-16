import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateFleetCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const createFleet: AppBlock = {
  name: "Create Fleet",
  description: `Creates an EC2 Fleet that contains the configuration information for On-Demand Instances and Spot Instances.`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        SpotOptions: {
          name: "Spot Options",
          description:
            "Describes the configuration of Spot Instances in an EC2 Fleet.",
          type: {
            type: "object",
            properties: {
              AllocationStrategy: {
                type: "string",
              },
              MaintenanceStrategies: {
                type: "object",
                properties: {
                  CapacityRebalance: {
                    type: "object",
                    properties: {
                      ReplacementStrategy: {
                        type: "string",
                      },
                      TerminationDelay: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              InstanceInterruptionBehavior: {
                type: "string",
              },
              InstancePoolsToUseCount: {
                type: "number",
              },
              SingleInstanceType: {
                type: "boolean",
              },
              SingleAvailabilityZone: {
                type: "boolean",
              },
              MinTargetCapacity: {
                type: "number",
              },
              MaxTotalPrice: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        OnDemandOptions: {
          name: "On Demand Options",
          description:
            "Describes the configuration of On-Demand Instances in an EC2 Fleet.",
          type: {
            type: "object",
            properties: {
              AllocationStrategy: {
                type: "string",
              },
              CapacityReservationOptions: {
                type: "object",
                properties: {
                  UsageStrategy: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              SingleInstanceType: {
                type: "boolean",
              },
              SingleAvailabilityZone: {
                type: "boolean",
              },
              MinTargetCapacity: {
                type: "number",
              },
              MaxTotalPrice: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        ReservedCapacityOptions: {
          name: "Reserved Capacity Options",
          description:
            "Defines EC2 Fleet preferences for utilizing reserved capacity when DefaultTargetCapacityType is set to reserved-capacity.",
          type: {
            type: "object",
            properties: {
              ReservationTypes: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        ExcessCapacityTerminationPolicy: {
          name: "Excess Capacity Termination Policy",
          description:
            "Indicates whether running instances should be terminated if the total target capacity of the EC2 Fleet is decreased below the current size of the EC2 Fleet.",
          type: "string",
          required: false,
        },
        LaunchTemplateConfigs: {
          name: "Launch Template Configs",
          description: "The configuration for the EC2 Fleet.",
          type: {
            type: "array",
            items: {
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
                        type: "string",
                      },
                      MaxPrice: {
                        type: "string",
                      },
                      SubnetId: {
                        type: "string",
                      },
                      AvailabilityZone: {
                        type: "string",
                      },
                      WeightedCapacity: {
                        type: "number",
                      },
                      Priority: {
                        type: "number",
                      },
                      Placement: {
                        type: "object",
                        properties: {
                          AvailabilityZoneId: {},
                          Affinity: {},
                          GroupName: {},
                          PartitionNumber: {},
                          HostId: {},
                          Tenancy: {},
                          SpreadDomain: {},
                          HostResourceGroupArn: {},
                          GroupId: {},
                          AvailabilityZone: {},
                        },
                        additionalProperties: false,
                      },
                      BlockDeviceMappings: {
                        type: "array",
                        items: {},
                      },
                      InstanceRequirements: {
                        type: "object",
                        properties: {
                          VCpuCount: {},
                          MemoryMiB: {},
                          CpuManufacturers: {},
                          MemoryGiBPerVCpu: {},
                          ExcludedInstanceTypes: {},
                          InstanceGenerations: {},
                          SpotMaxPricePercentageOverLowestPrice: {},
                          OnDemandMaxPricePercentageOverLowestPrice: {},
                          BareMetal: {},
                          BurstablePerformance: {},
                          RequireHibernateSupport: {},
                          NetworkInterfaceCount: {},
                          LocalStorage: {},
                          LocalStorageTypes: {},
                          TotalLocalStorageGB: {},
                          BaselineEbsBandwidthMbps: {},
                          AcceleratorTypes: {},
                          AcceleratorCount: {},
                          AcceleratorManufacturers: {},
                          AcceleratorNames: {},
                          AcceleratorTotalMemoryMiB: {},
                          NetworkBandwidthGbps: {},
                          AllowedInstanceTypes: {},
                          MaxSpotPriceAsPercentageOfOptimalOnDemandPrice: {},
                          BaselinePerformanceFactors: {},
                          RequireEncryptionInTransit: {},
                        },
                        required: ["VCpuCount", "MemoryMiB"],
                        additionalProperties: false,
                      },
                      ImageId: {
                        type: "string",
                      },
                      AvailabilityZoneId: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: true,
        },
        TargetCapacitySpecification: {
          name: "Target Capacity Specification",
          description: "The number of units to request.",
          type: {
            type: "object",
            properties: {
              TotalTargetCapacity: {
                type: "number",
              },
              OnDemandTargetCapacity: {
                type: "number",
              },
              SpotTargetCapacity: {
                type: "number",
              },
              DefaultTargetCapacityType: {
                type: "string",
              },
              TargetCapacityUnitType: {
                type: "string",
              },
            },
            required: ["TotalTargetCapacity"],
            additionalProperties: false,
          },
          required: true,
        },
        TerminateInstancesWithExpiration: {
          name: "Terminate Instances With Expiration",
          description:
            "Indicates whether running instances should be terminated when the EC2 Fleet expires.",
          type: "boolean",
          required: false,
        },
        Type: {
          name: "Type",
          description: "The fleet type.",
          type: "string",
          required: false,
        },
        ValidFrom: {
          name: "Valid From",
          description:
            "The start date and time of the request, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).",
          type: "string",
          required: false,
        },
        ValidUntil: {
          name: "Valid Until",
          description:
            "The end date and time of the request, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).",
          type: "string",
          required: false,
        },
        ReplaceUnhealthyInstances: {
          name: "Replace Unhealthy Instances",
          description:
            "Indicates whether EC2 Fleet should replace unhealthy Spot Instances.",
          type: "boolean",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description:
            "The key-value pair for tagging the EC2 Fleet request on creation.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ResourceType: {
                  type: "string",
                },
                Tags: {
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
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        Context: {
          name: "Context",
          description: "Reserved.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateFleetCommand(
          convertTimestamps(
            commandInput,
            new Set(["ValidFrom", "ValidUntil"]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Fleet Result",
      description: "Result from CreateFleet operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          FleetId: {
            type: "string",
            description: "The ID of the EC2 Fleet.",
          },
          Errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                LaunchTemplateAndOverrides: {
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
                      type: "object",
                      properties: {
                        InstanceType: {
                          type: "string",
                        },
                        MaxPrice: {
                          type: "string",
                        },
                        SubnetId: {
                          type: "string",
                        },
                        AvailabilityZone: {
                          type: "string",
                        },
                        WeightedCapacity: {
                          type: "number",
                        },
                        Priority: {
                          type: "number",
                        },
                        Placement: {
                          type: "object",
                          properties: {
                            GroupName: {},
                          },
                          additionalProperties: false,
                        },
                        InstanceRequirements: {
                          type: "object",
                          properties: {
                            VCpuCount: {},
                            MemoryMiB: {},
                            CpuManufacturers: {},
                            MemoryGiBPerVCpu: {},
                            ExcludedInstanceTypes: {},
                            InstanceGenerations: {},
                            SpotMaxPricePercentageOverLowestPrice: {},
                            OnDemandMaxPricePercentageOverLowestPrice: {},
                            BareMetal: {},
                            BurstablePerformance: {},
                            RequireHibernateSupport: {},
                            NetworkInterfaceCount: {},
                            LocalStorage: {},
                            LocalStorageTypes: {},
                            TotalLocalStorageGB: {},
                            BaselineEbsBandwidthMbps: {},
                            AcceleratorTypes: {},
                            AcceleratorCount: {},
                            AcceleratorManufacturers: {},
                            AcceleratorNames: {},
                            AcceleratorTotalMemoryMiB: {},
                            NetworkBandwidthGbps: {},
                            AllowedInstanceTypes: {},
                            MaxSpotPriceAsPercentageOfOptimalOnDemandPrice: {},
                            BaselinePerformanceFactors: {},
                            RequireEncryptionInTransit: {},
                          },
                          additionalProperties: false,
                        },
                        ImageId: {
                          type: "string",
                        },
                        BlockDeviceMappings: {
                          type: "array",
                          items: {},
                        },
                        AvailabilityZoneId: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                Lifecycle: {
                  type: "string",
                },
                ErrorCode: {
                  type: "string",
                },
                ErrorMessage: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the instances that could not be launched by the fleet.",
          },
          Instances: {
            type: "array",
            items: {
              type: "object",
              properties: {
                LaunchTemplateAndOverrides: {
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
                      type: "object",
                      properties: {
                        InstanceType: {
                          type: "string",
                        },
                        MaxPrice: {
                          type: "string",
                        },
                        SubnetId: {
                          type: "string",
                        },
                        AvailabilityZone: {
                          type: "string",
                        },
                        WeightedCapacity: {
                          type: "number",
                        },
                        Priority: {
                          type: "number",
                        },
                        Placement: {
                          type: "object",
                          properties: {
                            GroupName: {},
                          },
                          additionalProperties: false,
                        },
                        InstanceRequirements: {
                          type: "object",
                          properties: {
                            VCpuCount: {},
                            MemoryMiB: {},
                            CpuManufacturers: {},
                            MemoryGiBPerVCpu: {},
                            ExcludedInstanceTypes: {},
                            InstanceGenerations: {},
                            SpotMaxPricePercentageOverLowestPrice: {},
                            OnDemandMaxPricePercentageOverLowestPrice: {},
                            BareMetal: {},
                            BurstablePerformance: {},
                            RequireHibernateSupport: {},
                            NetworkInterfaceCount: {},
                            LocalStorage: {},
                            LocalStorageTypes: {},
                            TotalLocalStorageGB: {},
                            BaselineEbsBandwidthMbps: {},
                            AcceleratorTypes: {},
                            AcceleratorCount: {},
                            AcceleratorManufacturers: {},
                            AcceleratorNames: {},
                            AcceleratorTotalMemoryMiB: {},
                            NetworkBandwidthGbps: {},
                            AllowedInstanceTypes: {},
                            MaxSpotPriceAsPercentageOfOptimalOnDemandPrice: {},
                            BaselinePerformanceFactors: {},
                            RequireEncryptionInTransit: {},
                          },
                          additionalProperties: false,
                        },
                        ImageId: {
                          type: "string",
                        },
                        BlockDeviceMappings: {
                          type: "array",
                          items: {},
                        },
                        AvailabilityZoneId: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                Lifecycle: {
                  type: "string",
                },
                InstanceIds: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                InstanceType: {
                  type: "string",
                },
                Platform: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the instances that were launched by the fleet.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createFleet;

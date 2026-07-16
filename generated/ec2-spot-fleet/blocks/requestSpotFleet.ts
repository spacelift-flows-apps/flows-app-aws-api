import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, RequestSpotFleetCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const requestSpotFleet: AppBlock = {
  name: "Request Spot Fleet",
  description: `Creates a Spot Fleet request.`,
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
        SpotFleetRequestConfig: {
          name: "Spot Fleet Request Config",
          description: "The configuration for the Spot Fleet request.",
          type: {
            type: "object",
            properties: {
              AllocationStrategy: {
                type: "string",
              },
              OnDemandAllocationStrategy: {
                type: "string",
              },
              SpotMaintenanceStrategies: {
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
              ClientToken: {
                type: "string",
              },
              ExcessCapacityTerminationPolicy: {
                type: "string",
              },
              FulfilledCapacity: {
                type: "number",
              },
              OnDemandFulfilledCapacity: {
                type: "number",
              },
              IamFleetRole: {
                type: "string",
              },
              LaunchSpecifications: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AddressingType: {
                      type: "string",
                    },
                    BlockDeviceMappings: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Ebs: {},
                          NoDevice: {},
                          DeviceName: {},
                          VirtualName: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    EbsOptimized: {
                      type: "boolean",
                    },
                    IamInstanceProfile: {
                      type: "object",
                      properties: {
                        Arn: {
                          type: "string",
                        },
                        Name: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                    ImageId: {
                      type: "string",
                    },
                    InstanceType: {
                      type: "string",
                    },
                    KernelId: {
                      type: "string",
                    },
                    KeyName: {
                      type: "string",
                    },
                    Monitoring: {
                      type: "object",
                      properties: {
                        Enabled: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                    NetworkInterfaces: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          AssociatePublicIpAddress: {},
                          DeleteOnTermination: {},
                          Description: {},
                          DeviceIndex: {},
                          Groups: {},
                          Ipv6AddressCount: {},
                          Ipv6Addresses: {},
                          NetworkInterfaceId: {},
                          PrivateIpAddress: {},
                          PrivateIpAddresses: {},
                          SecondaryPrivateIpAddressCount: {},
                          SubnetId: {},
                          AssociateCarrierIpAddress: {},
                          InterfaceType: {},
                          NetworkCardIndex: {},
                          Ipv4Prefixes: {},
                          Ipv4PrefixCount: {},
                          Ipv6Prefixes: {},
                          Ipv6PrefixCount: {},
                          PrimaryIpv6: {},
                          EnaSrdSpecification: {},
                          ConnectionTrackingSpecification: {},
                          EnaQueueCount: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    Placement: {
                      type: "object",
                      properties: {
                        AvailabilityZone: {
                          type: "string",
                        },
                        GroupName: {
                          type: "string",
                        },
                        Tenancy: {
                          type: "string",
                        },
                        AvailabilityZoneId: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                    RamdiskId: {
                      type: "string",
                    },
                    SpotPrice: {
                      type: "string",
                    },
                    SubnetId: {
                      type: "string",
                    },
                    UserData: {
                      type: "string",
                    },
                    WeightedCapacity: {
                      type: "number",
                    },
                    TagSpecifications: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          ResourceType: {},
                          Tags: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    InstanceRequirements: {
                      type: "object",
                      properties: {
                        VCpuCount: {
                          type: "object",
                          properties: {
                            Min: {},
                            Max: {},
                          },
                          additionalProperties: false,
                        },
                        MemoryMiB: {
                          type: "object",
                          properties: {
                            Min: {},
                            Max: {},
                          },
                          additionalProperties: false,
                        },
                        CpuManufacturers: {
                          type: "array",
                          items: {},
                        },
                        MemoryGiBPerVCpu: {
                          type: "object",
                          properties: {
                            Min: {},
                            Max: {},
                          },
                          additionalProperties: false,
                        },
                        ExcludedInstanceTypes: {
                          type: "array",
                          items: {},
                        },
                        InstanceGenerations: {
                          type: "array",
                          items: {},
                        },
                        SpotMaxPricePercentageOverLowestPrice: {
                          type: "number",
                        },
                        OnDemandMaxPricePercentageOverLowestPrice: {
                          type: "number",
                        },
                        BareMetal: {
                          type: "string",
                        },
                        BurstablePerformance: {
                          type: "string",
                        },
                        RequireHibernateSupport: {
                          type: "boolean",
                        },
                        NetworkInterfaceCount: {
                          type: "object",
                          properties: {
                            Min: {},
                            Max: {},
                          },
                          additionalProperties: false,
                        },
                        LocalStorage: {
                          type: "string",
                        },
                        LocalStorageTypes: {
                          type: "array",
                          items: {},
                        },
                        TotalLocalStorageGB: {
                          type: "object",
                          properties: {
                            Min: {},
                            Max: {},
                          },
                          additionalProperties: false,
                        },
                        BaselineEbsBandwidthMbps: {
                          type: "object",
                          properties: {
                            Min: {},
                            Max: {},
                          },
                          additionalProperties: false,
                        },
                        AcceleratorTypes: {
                          type: "array",
                          items: {},
                        },
                        AcceleratorCount: {
                          type: "object",
                          properties: {
                            Min: {},
                            Max: {},
                          },
                          additionalProperties: false,
                        },
                        AcceleratorManufacturers: {
                          type: "array",
                          items: {},
                        },
                        AcceleratorNames: {
                          type: "array",
                          items: {},
                        },
                        AcceleratorTotalMemoryMiB: {
                          type: "object",
                          properties: {
                            Min: {},
                            Max: {},
                          },
                          additionalProperties: false,
                        },
                        NetworkBandwidthGbps: {
                          type: "object",
                          properties: {
                            Min: {},
                            Max: {},
                          },
                          additionalProperties: false,
                        },
                        AllowedInstanceTypes: {
                          type: "array",
                          items: {},
                        },
                        MaxSpotPriceAsPercentageOfOptimalOnDemandPrice: {
                          type: "number",
                        },
                        BaselinePerformanceFactors: {
                          type: "object",
                          properties: {
                            Cpu: {},
                          },
                          additionalProperties: false,
                        },
                        RequireEncryptionInTransit: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                    SecurityGroups: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          GroupId: {},
                          GroupName: {},
                        },
                        additionalProperties: false,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              LaunchTemplateConfigs: {
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
                          InstanceType: {},
                          SpotPrice: {},
                          SubnetId: {},
                          AvailabilityZone: {},
                          WeightedCapacity: {},
                          Priority: {},
                          InstanceRequirements: {},
                          AvailabilityZoneId: {},
                        },
                        additionalProperties: false,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              SpotPrice: {
                type: "string",
              },
              TargetCapacity: {
                type: "number",
              },
              OnDemandTargetCapacity: {
                type: "number",
              },
              OnDemandMaxTotalPrice: {
                type: "string",
              },
              SpotMaxTotalPrice: {
                type: "string",
              },
              TerminateInstancesWithExpiration: {
                type: "boolean",
              },
              Type: {
                type: "string",
              },
              ValidFrom: {
                type: "string",
              },
              ValidUntil: {
                type: "string",
              },
              ReplaceUnhealthyInstances: {
                type: "boolean",
              },
              InstanceInterruptionBehavior: {
                type: "string",
              },
              LoadBalancersConfig: {
                type: "object",
                properties: {
                  ClassicLoadBalancersConfig: {
                    type: "object",
                    properties: {
                      ClassicLoadBalancers: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            Name: {},
                          },
                          additionalProperties: false,
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                  TargetGroupsConfig: {
                    type: "object",
                    properties: {
                      TargetGroups: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            Arn: {},
                          },
                          additionalProperties: false,
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              InstancePoolsToUseCount: {
                type: "number",
              },
              Context: {
                type: "string",
              },
              TargetCapacityUnitType: {
                type: "string",
              },
              TagSpecifications: {
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
                          Key: {},
                          Value: {},
                        },
                        additionalProperties: false,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            required: ["IamFleetRole", "TargetCapacity"],
            additionalProperties: false,
          },
          required: true,
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

        const command = new RequestSpotFleetCommand(
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
      name: "Request Spot Fleet Result",
      description: "Result from RequestSpotFleet operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SpotFleetRequestId: {
            type: "string",
            description: "The ID of the Spot Fleet request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default requestSpotFleet;

import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, GetLaunchTemplateDataCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getLaunchTemplateData: AppBlock = {
  name: "Get Launch Template Data",
  description: `Retrieves the configuration data of the specified instance.`,
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
        InstanceId: {
          name: "Instance Id",
          description: "The ID of the instance.",
          type: "string",
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

        const command = new GetLaunchTemplateDataCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Launch Template Data Result",
      description: "Result from GetLaunchTemplateData operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          LaunchTemplateData: {
            type: "object",
            properties: {
              KernelId: {
                type: "string",
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
              BlockDeviceMappings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DeviceName: {
                      type: "string",
                    },
                    VirtualName: {
                      type: "string",
                    },
                    Ebs: {
                      type: "object",
                      properties: {
                        Encrypted: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DeleteOnTermination: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Iops: {
                          type: "object",
                          additionalProperties: true,
                        },
                        KmsKeyId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SnapshotId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        VolumeSize: {
                          type: "object",
                          additionalProperties: true,
                        },
                        VolumeType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Throughput: {
                          type: "object",
                          additionalProperties: true,
                        },
                        VolumeInitializationRate: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    NoDevice: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              NetworkInterfaces: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AssociateCarrierIpAddress: {
                      type: "boolean",
                    },
                    AssociatePublicIpAddress: {
                      type: "boolean",
                    },
                    DeleteOnTermination: {
                      type: "boolean",
                    },
                    Description: {
                      type: "string",
                    },
                    DeviceIndex: {
                      type: "number",
                    },
                    Groups: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    InterfaceType: {
                      type: "string",
                    },
                    Ipv6AddressCount: {
                      type: "number",
                    },
                    Ipv6Addresses: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    NetworkInterfaceId: {
                      type: "string",
                    },
                    PrivateIpAddress: {
                      type: "string",
                    },
                    PrivateIpAddresses: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    SecondaryPrivateIpAddressCount: {
                      type: "number",
                    },
                    SubnetId: {
                      type: "string",
                    },
                    NetworkCardIndex: {
                      type: "number",
                    },
                    Ipv4Prefixes: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Ipv4PrefixCount: {
                      type: "number",
                    },
                    Ipv6Prefixes: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Ipv6PrefixCount: {
                      type: "number",
                    },
                    PrimaryIpv6: {
                      type: "boolean",
                    },
                    EnaSrdSpecification: {
                      type: "object",
                      properties: {
                        EnaSrdEnabled: {
                          type: "object",
                          additionalProperties: true,
                        },
                        EnaSrdUdpSpecification: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    ConnectionTrackingSpecification: {
                      type: "object",
                      properties: {
                        TcpEstablishedTimeout: {
                          type: "object",
                          additionalProperties: true,
                        },
                        UdpTimeout: {
                          type: "object",
                          additionalProperties: true,
                        },
                        UdpStreamTimeout: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    EnaQueueCount: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
              },
              ImageId: {
                type: "string",
              },
              InstanceType: {
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
              Placement: {
                type: "object",
                properties: {
                  AvailabilityZone: {
                    type: "string",
                  },
                  Affinity: {
                    type: "string",
                  },
                  GroupName: {
                    type: "string",
                  },
                  HostId: {
                    type: "string",
                  },
                  Tenancy: {
                    type: "string",
                  },
                  SpreadDomain: {
                    type: "string",
                  },
                  HostResourceGroupArn: {
                    type: "string",
                  },
                  PartitionNumber: {
                    type: "number",
                  },
                  GroupId: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              RamDiskId: {
                type: "string",
              },
              DisableApiTermination: {
                type: "boolean",
              },
              InstanceInitiatedShutdownBehavior: {
                type: "string",
              },
              UserData: {
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
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              ElasticGpuSpecifications: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Type: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              ElasticInferenceAccelerators: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Type: {
                      type: "string",
                    },
                    Count: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
              },
              SecurityGroupIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              SecurityGroups: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              InstanceMarketOptions: {
                type: "object",
                properties: {
                  MarketType: {
                    type: "string",
                  },
                  SpotOptions: {
                    type: "object",
                    properties: {
                      MaxPrice: {
                        type: "string",
                      },
                      SpotInstanceType: {
                        type: "string",
                      },
                      BlockDurationMinutes: {
                        type: "number",
                      },
                      ValidUntil: {
                        type: "string",
                      },
                      InstanceInterruptionBehavior: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              CreditSpecification: {
                type: "object",
                properties: {
                  CpuCredits: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              CpuOptions: {
                type: "object",
                properties: {
                  CoreCount: {
                    type: "number",
                  },
                  ThreadsPerCore: {
                    type: "number",
                  },
                  AmdSevSnp: {
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
                      CapacityReservationId: {
                        type: "string",
                      },
                      CapacityReservationResourceGroupArn: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              LicenseSpecifications: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    LicenseConfigurationArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              HibernationOptions: {
                type: "object",
                properties: {
                  Configured: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              MetadataOptions: {
                type: "object",
                properties: {
                  State: {
                    type: "string",
                  },
                  HttpTokens: {
                    type: "string",
                  },
                  HttpPutResponseHopLimit: {
                    type: "number",
                  },
                  HttpEndpoint: {
                    type: "string",
                  },
                  HttpProtocolIpv6: {
                    type: "string",
                  },
                  InstanceMetadataTags: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              EnclaveOptions: {
                type: "object",
                properties: {
                  Enabled: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              InstanceRequirements: {
                type: "object",
                properties: {
                  VCpuCount: {
                    type: "object",
                    properties: {
                      Min: {
                        type: "number",
                      },
                      Max: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  MemoryMiB: {
                    type: "object",
                    properties: {
                      Min: {
                        type: "number",
                      },
                      Max: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  CpuManufacturers: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  MemoryGiBPerVCpu: {
                    type: "object",
                    properties: {
                      Min: {
                        type: "number",
                      },
                      Max: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  ExcludedInstanceTypes: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  InstanceGenerations: {
                    type: "array",
                    items: {
                      type: "string",
                    },
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
                      Min: {
                        type: "number",
                      },
                      Max: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  LocalStorage: {
                    type: "string",
                  },
                  LocalStorageTypes: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  TotalLocalStorageGB: {
                    type: "object",
                    properties: {
                      Min: {
                        type: "number",
                      },
                      Max: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  BaselineEbsBandwidthMbps: {
                    type: "object",
                    properties: {
                      Min: {
                        type: "number",
                      },
                      Max: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  AcceleratorTypes: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  AcceleratorCount: {
                    type: "object",
                    properties: {
                      Min: {
                        type: "number",
                      },
                      Max: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  AcceleratorManufacturers: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  AcceleratorNames: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  AcceleratorTotalMemoryMiB: {
                    type: "object",
                    properties: {
                      Min: {
                        type: "number",
                      },
                      Max: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  NetworkBandwidthGbps: {
                    type: "object",
                    properties: {
                      Min: {
                        type: "number",
                      },
                      Max: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  AllowedInstanceTypes: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  MaxSpotPriceAsPercentageOfOptimalOnDemandPrice: {
                    type: "number",
                  },
                  BaselinePerformanceFactors: {
                    type: "object",
                    properties: {
                      Cpu: {
                        type: "object",
                        properties: {
                          References: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              PrivateDnsNameOptions: {
                type: "object",
                properties: {
                  HostnameType: {
                    type: "string",
                  },
                  EnableResourceNameDnsARecord: {
                    type: "boolean",
                  },
                  EnableResourceNameDnsAAAARecord: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              MaintenanceOptions: {
                type: "object",
                properties: {
                  AutoRecovery: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              DisableApiStop: {
                type: "boolean",
              },
              Operator: {
                type: "object",
                properties: {
                  Managed: {
                    type: "boolean",
                  },
                  Principal: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              NetworkPerformanceOptions: {
                type: "object",
                properties: {
                  BandwidthWeighting: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "The instance data.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getLaunchTemplateData;

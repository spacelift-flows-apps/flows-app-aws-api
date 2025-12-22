import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  CreateLaunchTemplateVersionCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createLaunchTemplateVersion: AppBlock = {
  name: "Create Launch Template Version",
  description: `Creates a new version of a launch template.`,
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
            "Unique, case-sensitive identifier you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        LaunchTemplateId: {
          name: "Launch Template Id",
          description: "The ID of the launch template.",
          type: "string",
          required: false,
        },
        LaunchTemplateName: {
          name: "Launch Template Name",
          description: "The name of the launch template.",
          type: "string",
          required: false,
        },
        SourceVersion: {
          name: "Source Version",
          description:
            "The version of the launch template on which to base the new version.",
          type: "string",
          required: false,
        },
        VersionDescription: {
          name: "Version Description",
          description: "A description for the version of the launch template.",
          type: "string",
          required: false,
        },
        LaunchTemplateData: {
          name: "Launch Template Data",
          description: "The information for the launch template.",
          type: {
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
                        UdpStreamTimeout: {
                          type: "object",
                          additionalProperties: true,
                        },
                        UdpTimeout: {
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
                  required: ["Type"],
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
                  required: ["Type"],
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
                required: ["CpuCredits"],
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
                    required: ["Min"],
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
                    required: ["Min"],
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
                required: ["VCpuCount", "MemoryMiB"],
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
          },
          required: true,
        },
        ResolveAlias: {
          name: "Resolve Alias",
          description:
            "If true, and if a Systems Manager parameter is specified for ImageId, the AMI ID is displayed in the response for imageID.",
          type: "boolean",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateLaunchTemplateVersionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Launch Template Version Result",
      description: "Result from CreateLaunchTemplateVersion operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          LaunchTemplateVersion: {
            type: "object",
            properties: {
              LaunchTemplateId: {
                type: "string",
              },
              LaunchTemplateName: {
                type: "string",
              },
              VersionNumber: {
                type: "number",
              },
              VersionDescription: {
                type: "string",
              },
              CreateTime: {
                type: "string",
              },
              CreatedBy: {
                type: "string",
              },
              DefaultVersion: {
                type: "boolean",
              },
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
                          type: "object",
                          additionalProperties: true,
                        },
                        VirtualName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Ebs: {
                          type: "object",
                          additionalProperties: true,
                        },
                        NoDevice: {
                          type: "object",
                          additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        AssociatePublicIpAddress: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DeleteOnTermination: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Description: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DeviceIndex: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Groups: {
                          type: "object",
                          additionalProperties: true,
                        },
                        InterfaceType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Ipv6AddressCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Ipv6Addresses: {
                          type: "object",
                          additionalProperties: true,
                        },
                        NetworkInterfaceId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        PrivateIpAddress: {
                          type: "object",
                          additionalProperties: true,
                        },
                        PrivateIpAddresses: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SecondaryPrivateIpAddressCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SubnetId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        NetworkCardIndex: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Ipv4Prefixes: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Ipv4PrefixCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Ipv6Prefixes: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Ipv6PrefixCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        PrimaryIpv6: {
                          type: "object",
                          additionalProperties: true,
                        },
                        EnaSrdSpecification: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ConnectionTrackingSpecification: {
                          type: "object",
                          additionalProperties: true,
                        },
                        EnaQueueCount: {
                          type: "object",
                          additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        Tags: {
                          type: "object",
                          additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        Count: {
                          type: "object",
                          additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
                          },
                          SpotInstanceType: {
                            type: "object",
                            additionalProperties: true,
                          },
                          BlockDurationMinutes: {
                            type: "object",
                            additionalProperties: true,
                          },
                          ValidUntil: {
                            type: "object",
                            additionalProperties: true,
                          },
                          InstanceInterruptionBehavior: {
                            type: "object",
                            additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
                          },
                          CapacityReservationResourceGroupArn: {
                            type: "object",
                            additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
                          },
                          Max: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      MemoryMiB: {
                        type: "object",
                        properties: {
                          Min: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Max: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      CpuManufacturers: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      MemoryGiBPerVCpu: {
                        type: "object",
                        properties: {
                          Min: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Max: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      ExcludedInstanceTypes: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      InstanceGenerations: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
                          },
                          Max: {
                            type: "object",
                            additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      TotalLocalStorageGB: {
                        type: "object",
                        properties: {
                          Min: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Max: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      BaselineEbsBandwidthMbps: {
                        type: "object",
                        properties: {
                          Min: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Max: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      AcceleratorTypes: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      AcceleratorCount: {
                        type: "object",
                        properties: {
                          Min: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Max: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      AcceleratorManufacturers: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      AcceleratorNames: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      AcceleratorTotalMemoryMiB: {
                        type: "object",
                        properties: {
                          Min: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Max: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      NetworkBandwidthGbps: {
                        type: "object",
                        properties: {
                          Min: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Max: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      AllowedInstanceTypes: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
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
                            additionalProperties: true,
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
            },
            additionalProperties: false,
            description: "Information about the launch template version.",
          },
          Warning: {
            type: "object",
            properties: {
              Errors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Code: {
                      type: "string",
                    },
                    Message: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description:
              "If the new version of the launch template contains parameters or parameter combinations that are not valid, an error code and an error message are returned for each issue that's found.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createLaunchTemplateVersion;

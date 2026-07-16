import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeLaunchTemplateVersionsCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeLaunchTemplateVersions: AppBlock = {
  name: "Describe Launch Template Versions",
  description: `Describes one or more versions of a specified launch template.`,
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
        Versions: {
          name: "Versions",
          description: "One or more versions of the launch template.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        MinVersion: {
          name: "Min Version",
          description:
            "The version number after which to describe launch template versions.",
          type: "string",
          required: false,
        },
        MaxVersion: {
          name: "Max Version",
          description:
            "The version number up to which to describe launch template versions.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token to request the next page of results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to return in a single call.",
          type: "number",
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "One or more filters.",
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
        ResolveAlias: {
          name: "Resolve Alias",
          description:
            "If true, and if a Systems Manager parameter is specified for ImageId, the AMI ID is displayed in the response for imageId.",
          type: "boolean",
          required: false,
        },
        IncludeManagedResources: {
          name: "Include Managed Resources",
          description:
            "Indicates whether to include managed resources in the output.",
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

        const command = new DescribeLaunchTemplateVersionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Launch Template Versions Result",
      description: "Result from DescribeLaunchTemplateVersions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          LaunchTemplateVersions: {
            type: "array",
            items: {
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
                          DeviceName: {},
                          VirtualName: {},
                          Ebs: {},
                          NoDevice: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    NetworkInterfaces: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          AssociateCarrierIpAddress: {},
                          AssociatePublicIpAddress: {},
                          DeleteOnTermination: {},
                          Description: {},
                          DeviceIndex: {},
                          Groups: {},
                          InterfaceType: {},
                          Ipv6AddressCount: {},
                          Ipv6Addresses: {},
                          NetworkInterfaceId: {},
                          PrivateIpAddress: {},
                          PrivateIpAddresses: {},
                          SecondaryPrivateIpAddressCount: {},
                          SubnetId: {},
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
                        AvailabilityZoneId: {
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
                          ResourceType: {},
                          Tags: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    ElasticGpuSpecifications: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Type: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    ElasticInferenceAccelerators: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Type: {},
                          Count: {},
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
                            MaxPrice: {},
                            SpotInstanceType: {},
                            BlockDurationMinutes: {},
                            ValidUntil: {},
                            InstanceInterruptionBehavior: {},
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
                        NestedVirtualization: {
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
                            CapacityReservationId: {},
                            CapacityReservationResourceGroupArn: {},
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
                          LicenseConfigurationArn: {},
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
                        HiddenByDefault: {
                          type: "boolean",
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
                    SecondaryInterfaces: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          DeleteOnTermination: {},
                          DeviceIndex: {},
                          PrivateIpAddresses: {},
                          PrivateIpAddressCount: {},
                          SecondarySubnetId: {},
                          InterfaceType: {},
                          NetworkCardIndex: {},
                        },
                        additionalProperties: false,
                      },
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
                    HiddenByDefault: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "Information about the launch template versions.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to use to retrieve the next page of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeLaunchTemplateVersions;

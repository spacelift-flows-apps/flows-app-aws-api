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
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        Name: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    BlockDeviceMappings: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    NetworkInterfaces: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    Placement: {
                      type: "object",
                      properties: {
                        AvailabilityZone: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Affinity: {
                          type: "object",
                          additionalProperties: true,
                        },
                        GroupName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        HostId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Tenancy: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SpreadDomain: {
                          type: "object",
                          additionalProperties: true,
                        },
                        HostResourceGroupArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        PartitionNumber: {
                          type: "object",
                          additionalProperties: true,
                        },
                        GroupId: {
                          type: "object",
                          additionalProperties: true,
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
                        additionalProperties: true,
                      },
                    },
                    ElasticGpuSpecifications: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    ElasticInferenceAccelerators: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    SecurityGroupIds: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    SecurityGroups: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    InstanceMarketOptions: {
                      type: "object",
                      properties: {
                        MarketType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SpotOptions: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    CreditSpecification: {
                      type: "object",
                      properties: {
                        CpuCredits: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    CpuOptions: {
                      type: "object",
                      properties: {
                        CoreCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ThreadsPerCore: {
                          type: "object",
                          additionalProperties: true,
                        },
                        AmdSevSnp: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    CapacityReservationSpecification: {
                      type: "object",
                      properties: {
                        CapacityReservationPreference: {
                          type: "object",
                          additionalProperties: true,
                        },
                        CapacityReservationTarget: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    LicenseSpecifications: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    HibernationOptions: {
                      type: "object",
                      properties: {
                        Configured: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    MetadataOptions: {
                      type: "object",
                      properties: {
                        State: {
                          type: "object",
                          additionalProperties: true,
                        },
                        HttpTokens: {
                          type: "object",
                          additionalProperties: true,
                        },
                        HttpPutResponseHopLimit: {
                          type: "object",
                          additionalProperties: true,
                        },
                        HttpEndpoint: {
                          type: "object",
                          additionalProperties: true,
                        },
                        HttpProtocolIpv6: {
                          type: "object",
                          additionalProperties: true,
                        },
                        InstanceMetadataTags: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    EnclaveOptions: {
                      type: "object",
                      properties: {
                        Enabled: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    InstanceRequirements: {
                      type: "object",
                      properties: {
                        VCpuCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MemoryMiB: {
                          type: "object",
                          additionalProperties: true,
                        },
                        CpuManufacturers: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MemoryGiBPerVCpu: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ExcludedInstanceTypes: {
                          type: "object",
                          additionalProperties: true,
                        },
                        InstanceGenerations: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SpotMaxPricePercentageOverLowestPrice: {
                          type: "object",
                          additionalProperties: true,
                        },
                        OnDemandMaxPricePercentageOverLowestPrice: {
                          type: "object",
                          additionalProperties: true,
                        },
                        BareMetal: {
                          type: "object",
                          additionalProperties: true,
                        },
                        BurstablePerformance: {
                          type: "object",
                          additionalProperties: true,
                        },
                        RequireHibernateSupport: {
                          type: "object",
                          additionalProperties: true,
                        },
                        NetworkInterfaceCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        LocalStorage: {
                          type: "object",
                          additionalProperties: true,
                        },
                        LocalStorageTypes: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TotalLocalStorageGB: {
                          type: "object",
                          additionalProperties: true,
                        },
                        BaselineEbsBandwidthMbps: {
                          type: "object",
                          additionalProperties: true,
                        },
                        AcceleratorTypes: {
                          type: "object",
                          additionalProperties: true,
                        },
                        AcceleratorCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        AcceleratorManufacturers: {
                          type: "object",
                          additionalProperties: true,
                        },
                        AcceleratorNames: {
                          type: "object",
                          additionalProperties: true,
                        },
                        AcceleratorTotalMemoryMiB: {
                          type: "object",
                          additionalProperties: true,
                        },
                        NetworkBandwidthGbps: {
                          type: "object",
                          additionalProperties: true,
                        },
                        AllowedInstanceTypes: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MaxSpotPriceAsPercentageOfOptimalOnDemandPrice: {
                          type: "object",
                          additionalProperties: true,
                        },
                        BaselinePerformanceFactors: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    PrivateDnsNameOptions: {
                      type: "object",
                      properties: {
                        HostnameType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        EnableResourceNameDnsARecord: {
                          type: "object",
                          additionalProperties: true,
                        },
                        EnableResourceNameDnsAAAARecord: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    MaintenanceOptions: {
                      type: "object",
                      properties: {
                        AutoRecovery: {
                          type: "object",
                          additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        Principal: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    NetworkPerformanceOptions: {
                      type: "object",
                      properties: {
                        BandwidthWeighting: {
                          type: "object",
                          additionalProperties: true,
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

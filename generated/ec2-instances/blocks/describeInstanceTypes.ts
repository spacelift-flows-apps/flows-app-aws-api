import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeInstanceTypesCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeInstanceTypes: AppBlock = {
  name: "Describe Instance Types",
  description: `Describes the specified instance types.`,
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
        InstanceTypes: {
          name: "Instance Types",
          description: "The instance types.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of items to return for this request.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token returned from a previous paginated request.",
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

        const command = new DescribeInstanceTypesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Instance Types Result",
      description: "Result from DescribeInstanceTypes operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceTypes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                InstanceType: {
                  type: "string",
                },
                CurrentGeneration: {
                  type: "boolean",
                },
                FreeTierEligible: {
                  type: "boolean",
                },
                SupportedUsageClasses: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                SupportedRootDeviceTypes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                SupportedVirtualizationTypes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                BareMetal: {
                  type: "boolean",
                },
                Hypervisor: {
                  type: "string",
                },
                ProcessorInfo: {
                  type: "object",
                  properties: {
                    SupportedArchitectures: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    SustainedClockSpeedInGhz: {
                      type: "number",
                    },
                    SupportedFeatures: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Manufacturer: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                VCpuInfo: {
                  type: "object",
                  properties: {
                    DefaultVCpus: {
                      type: "number",
                    },
                    DefaultCores: {
                      type: "number",
                    },
                    DefaultThreadsPerCore: {
                      type: "number",
                    },
                    ValidCores: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    ValidThreadsPerCore: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                MemoryInfo: {
                  type: "object",
                  properties: {
                    SizeInMiB: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                InstanceStorageSupported: {
                  type: "boolean",
                },
                InstanceStorageInfo: {
                  type: "object",
                  properties: {
                    TotalSizeInGB: {
                      type: "number",
                    },
                    Disks: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    NvmeSupport: {
                      type: "string",
                    },
                    EncryptionSupport: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                EbsInfo: {
                  type: "object",
                  properties: {
                    EbsOptimizedSupport: {
                      type: "string",
                    },
                    EncryptionSupport: {
                      type: "string",
                    },
                    EbsOptimizedInfo: {
                      type: "object",
                      properties: {
                        BaselineBandwidthInMbps: {
                          type: "object",
                          additionalProperties: true,
                        },
                        BaselineThroughputInMBps: {
                          type: "object",
                          additionalProperties: true,
                        },
                        BaselineIops: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MaximumBandwidthInMbps: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MaximumThroughputInMBps: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MaximumIops: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    NvmeSupport: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                NetworkInfo: {
                  type: "object",
                  properties: {
                    NetworkPerformance: {
                      type: "string",
                    },
                    MaximumNetworkInterfaces: {
                      type: "number",
                    },
                    MaximumNetworkCards: {
                      type: "number",
                    },
                    DefaultNetworkCardIndex: {
                      type: "number",
                    },
                    NetworkCards: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Ipv4AddressesPerInterface: {
                      type: "number",
                    },
                    Ipv6AddressesPerInterface: {
                      type: "number",
                    },
                    Ipv6Supported: {
                      type: "boolean",
                    },
                    EnaSupport: {
                      type: "string",
                    },
                    EfaSupported: {
                      type: "boolean",
                    },
                    EfaInfo: {
                      type: "object",
                      properties: {
                        MaximumEfaInterfaces: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    EncryptionInTransitSupported: {
                      type: "boolean",
                    },
                    EnaSrdSupported: {
                      type: "boolean",
                    },
                    BandwidthWeightings: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    FlexibleEnaQueuesSupport: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                GpuInfo: {
                  type: "object",
                  properties: {
                    Gpus: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    TotalGpuMemoryInMiB: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                FpgaInfo: {
                  type: "object",
                  properties: {
                    Fpgas: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    TotalFpgaMemoryInMiB: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                PlacementGroupInfo: {
                  type: "object",
                  properties: {
                    SupportedStrategies: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                InferenceAcceleratorInfo: {
                  type: "object",
                  properties: {
                    Accelerators: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    TotalInferenceMemoryInMiB: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                HibernationSupported: {
                  type: "boolean",
                },
                BurstablePerformanceSupported: {
                  type: "boolean",
                },
                DedicatedHostsSupported: {
                  type: "boolean",
                },
                AutoRecoverySupported: {
                  type: "boolean",
                },
                SupportedBootModes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                NitroEnclavesSupport: {
                  type: "string",
                },
                NitroTpmSupport: {
                  type: "string",
                },
                NitroTpmInfo: {
                  type: "object",
                  properties: {
                    SupportedVersions: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                MediaAcceleratorInfo: {
                  type: "object",
                  properties: {
                    Accelerators: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    TotalMediaMemoryInMiB: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                NeuronInfo: {
                  type: "object",
                  properties: {
                    NeuronDevices: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    TotalNeuronDeviceMemoryInMiB: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                PhcSupport: {
                  type: "string",
                },
                RebootMigrationSupport: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The instance type.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeInstanceTypes;

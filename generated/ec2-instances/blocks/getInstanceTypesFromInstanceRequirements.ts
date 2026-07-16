import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  GetInstanceTypesFromInstanceRequirementsCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getInstanceTypesFromInstanceRequirements: AppBlock = {
  name: "Get Instance Types From Instance Requirements",
  description: `Returns a list of instance types with the specified instance attributes.`,
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
        ArchitectureTypes: {
          name: "Architecture Types",
          description: "The processor architecture type.",
          type: {
            type: "array",
            items: {
              type: "string",
              enum: ["i386", "x86_64", "arm64", "x86_64_mac", "arm64_mac"],
            },
          },
          required: true,
        },
        VirtualizationTypes: {
          name: "Virtualization Types",
          description: "The virtualization type.",
          type: {
            type: "array",
            items: {
              type: "string",
              enum: ["hvm", "paravirtual"],
            },
          },
          required: true,
        },
        InstanceRequirements: {
          name: "Instance Requirements",
          description: "The attributes required for the instance types.",
          type: {
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
                  enum: ["intel", "amd", "amazon-web-services", "apple"],
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
                  enum: ["current", "previous"],
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
                enum: ["included", "required", "excluded"],
              },
              BurstablePerformance: {
                type: "string",
                enum: ["included", "required", "excluded"],
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
                enum: ["included", "required", "excluded"],
              },
              LocalStorageTypes: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["hdd", "ssd"],
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
                  enum: ["gpu", "fpga", "inference", "media"],
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
                  enum: [
                    "amazon-web-services",
                    "amd",
                    "nvidia",
                    "xilinx",
                    "habana",
                  ],
                },
              },
              AcceleratorNames: {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "a100",
                    "inferentia",
                    "k520",
                    "k80",
                    "m60",
                    "radeon-pro-v520",
                    "t4",
                    "vu9p",
                    "v100",
                    "a10g",
                    "h100",
                    "t4g",
                    "l40s",
                    "l4",
                    "gaudi-hl-205",
                    "inferentia2",
                    "trainium",
                    "trainium2",
                    "u30",
                  ],
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
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            InstanceFamily: {},
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
              RequireEncryptionInTransit: {
                type: "boolean",
              },
            },
            required: ["VCpuCount", "MemoryMiB"],
            additionalProperties: false,
          },
          required: true,
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

        const command = new GetInstanceTypesFromInstanceRequirementsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Instance Types From Instance Requirements Result",
      description:
        "Result from GetInstanceTypesFromInstanceRequirements operation",
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
              },
              additionalProperties: false,
            },
            description:
              "The instance types with the specified instance attributes.",
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

export default getInstanceTypesFromInstanceRequirements;

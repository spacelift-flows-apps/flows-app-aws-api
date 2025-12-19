import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, GetSpotPlacementScoresCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getSpotPlacementScores: AppBlock = {
  name: "Get Spot Placement Scores",
  description: `Calculates the Spot placement score for a Region or Availability Zone based on the specified target capacity and compute requirements.`,
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
        TargetCapacity: {
          name: "Target Capacity",
          description: "The target capacity.",
          type: "number",
          required: true,
        },
        TargetCapacityUnitType: {
          name: "Target Capacity Unit Type",
          description: "The unit for the target capacity.",
          type: "string",
          required: false,
        },
        SingleAvailabilityZone: {
          name: "Single Availability Zone",
          description:
            "Specify true so that the response returns a list of scored Availability Zones.",
          type: "boolean",
          required: false,
        },
        RegionNames: {
          name: "Region Names",
          description:
            "The Regions used to narrow down the list of Regions to be scored.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        InstanceRequirementsWithMetadata: {
          name: "Instance Requirements With Metadata",
          description: "The attributes for the instance types.",
          type: {
            type: "object",
            properties: {
              ArchitectureTypes: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              VirtualizationTypes: {
                type: "array",
                items: {
                  type: "string",
                },
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
            },
            additionalProperties: false,
          },
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
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

        const command = new GetSpotPlacementScoresCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Spot Placement Scores Result",
      description: "Result from GetSpotPlacementScores operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SpotPlacementScores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Region: {
                  type: "string",
                },
                AvailabilityZoneId: {
                  type: "string",
                },
                Score: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description:
              "The Spot placement score for the top 10 Regions or Availability Zones, scored on a scale from 1 to 10.",
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

export default getSpotPlacementScores;

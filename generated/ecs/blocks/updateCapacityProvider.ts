import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, UpdateCapacityProviderCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateCapacityProvider: AppBlock = {
  name: "Update Capacity Provider",
  description: `Modifies the parameters for a capacity provider.`,
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
        name: {
          name: "name",
          description: "The name of the capacity provider to update.",
          type: "string",
          required: true,
        },
        cluster: {
          name: "cluster",
          description:
            "The name of the cluster that contains the capacity provider to update.",
          type: "string",
          required: false,
        },
        autoScalingGroupProvider: {
          name: "auto Scaling Group Provider",
          description:
            "An object that represent the parameters to update for the Auto Scaling group capacity provider.",
          type: {
            type: "object",
            properties: {
              managedScaling: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                  },
                  targetCapacity: {
                    type: "number",
                  },
                  minimumScalingStepSize: {
                    type: "number",
                  },
                  maximumScalingStepSize: {
                    type: "number",
                  },
                  instanceWarmupPeriod: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              managedTerminationProtection: {
                type: "string",
              },
              managedDraining: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        managedInstancesProvider: {
          name: "managed Instances Provider",
          description:
            "The updated configuration for the Amazon ECS Managed Instances provider.",
          type: {
            type: "object",
            properties: {
              infrastructureRoleArn: {
                type: "string",
              },
              instanceLaunchTemplate: {
                type: "object",
                properties: {
                  ec2InstanceProfileArn: {
                    type: "string",
                  },
                  networkConfiguration: {
                    type: "object",
                    properties: {
                      subnets: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                      securityGroups: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                  storageConfiguration: {
                    type: "object",
                    properties: {
                      storageSizeGiB: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  instanceMetadataTagsPropagation: {
                    type: "boolean",
                  },
                  localStorageConfiguration: {
                    type: "object",
                    properties: {
                      useLocalStorage: {
                        type: "boolean",
                      },
                    },
                    additionalProperties: false,
                  },
                  monitoring: {
                    type: "string",
                  },
                  instanceRequirements: {
                    type: "object",
                    properties: {
                      vCpuCount: {
                        type: "object",
                        properties: {
                          min: {
                            type: "number",
                          },
                          max: {
                            type: "number",
                          },
                        },
                        required: ["min"],
                        additionalProperties: false,
                      },
                      memoryMiB: {
                        type: "object",
                        properties: {
                          min: {
                            type: "number",
                          },
                          max: {
                            type: "number",
                          },
                        },
                        required: ["min"],
                        additionalProperties: false,
                      },
                      cpuManufacturers: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                      memoryGiBPerVCpu: {
                        type: "object",
                        properties: {
                          min: {
                            type: "number",
                          },
                          max: {
                            type: "number",
                          },
                        },
                        additionalProperties: false,
                      },
                      excludedInstanceTypes: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                      instanceGenerations: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                      spotMaxPricePercentageOverLowestPrice: {
                        type: "number",
                      },
                      onDemandMaxPricePercentageOverLowestPrice: {
                        type: "number",
                      },
                      bareMetal: {
                        type: "string",
                      },
                      burstablePerformance: {
                        type: "string",
                      },
                      requireHibernateSupport: {
                        type: "boolean",
                      },
                      networkInterfaceCount: {
                        type: "object",
                        properties: {
                          min: {
                            type: "number",
                          },
                          max: {
                            type: "number",
                          },
                        },
                        additionalProperties: false,
                      },
                      localStorage: {
                        type: "string",
                      },
                      localStorageTypes: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                      totalLocalStorageGB: {
                        type: "object",
                        properties: {
                          min: {
                            type: "number",
                          },
                          max: {
                            type: "number",
                          },
                        },
                        additionalProperties: false,
                      },
                      baselineEbsBandwidthMbps: {
                        type: "object",
                        properties: {
                          min: {
                            type: "number",
                          },
                          max: {
                            type: "number",
                          },
                        },
                        additionalProperties: false,
                      },
                      acceleratorTypes: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                      acceleratorCount: {
                        type: "object",
                        properties: {
                          min: {
                            type: "number",
                          },
                          max: {
                            type: "number",
                          },
                        },
                        additionalProperties: false,
                      },
                      acceleratorManufacturers: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                      acceleratorNames: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                      acceleratorTotalMemoryMiB: {
                        type: "object",
                        properties: {
                          min: {
                            type: "number",
                          },
                          max: {
                            type: "number",
                          },
                        },
                        additionalProperties: false,
                      },
                      networkBandwidthGbps: {
                        type: "object",
                        properties: {
                          min: {
                            type: "number",
                          },
                          max: {
                            type: "number",
                          },
                        },
                        additionalProperties: false,
                      },
                      allowedInstanceTypes: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                      maxSpotPriceAsPercentageOfOptimalOnDemandPrice: {
                        type: "number",
                      },
                    },
                    required: ["vCpuCount", "memoryMiB"],
                    additionalProperties: false,
                  },
                  capacityReservations: {
                    type: "object",
                    properties: {
                      reservationGroupArn: {
                        type: "string",
                      },
                      reservationPreference: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              propagateTags: {
                type: "string",
              },
              infrastructureOptimization: {
                type: "object",
                properties: {
                  scaleInAfter: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              autoRepairConfiguration: {
                type: "object",
                properties: {
                  actionsStatus: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            required: ["infrastructureRoleArn", "instanceLaunchTemplate"],
            additionalProperties: false,
          },
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

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateCapacityProviderCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Capacity Provider Result",
      description: "Result from UpdateCapacityProvider operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          capacityProvider: {
            type: "object",
            properties: {
              capacityProviderArn: {
                type: "string",
              },
              name: {
                type: "string",
              },
              cluster: {
                type: "string",
              },
              status: {
                type: "string",
              },
              autoScalingGroupProvider: {
                type: "object",
                properties: {
                  autoScalingGroupArn: {
                    type: "string",
                  },
                  managedScaling: {
                    type: "object",
                    properties: {
                      status: {
                        type: "string",
                      },
                      targetCapacity: {
                        type: "number",
                      },
                      minimumScalingStepSize: {
                        type: "number",
                      },
                      maximumScalingStepSize: {
                        type: "number",
                      },
                      instanceWarmupPeriod: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  managedTerminationProtection: {
                    type: "string",
                  },
                  managedDraining: {
                    type: "string",
                  },
                },
                required: ["autoScalingGroupArn"],
                additionalProperties: false,
              },
              managedInstancesProvider: {
                type: "object",
                properties: {
                  infrastructureRoleArn: {
                    type: "string",
                  },
                  instanceLaunchTemplate: {
                    type: "object",
                    properties: {
                      ec2InstanceProfileArn: {
                        type: "string",
                      },
                      networkConfiguration: {
                        type: "object",
                        properties: {
                          subnets: {
                            type: "array",
                            items: {},
                          },
                          securityGroups: {
                            type: "array",
                            items: {},
                          },
                        },
                        additionalProperties: false,
                      },
                      storageConfiguration: {
                        type: "object",
                        properties: {
                          storageSizeGiB: {
                            type: "number",
                          },
                        },
                        additionalProperties: false,
                      },
                      localStorageConfiguration: {
                        type: "object",
                        properties: {
                          useLocalStorage: {
                            type: "boolean",
                          },
                        },
                        additionalProperties: false,
                      },
                      monitoring: {
                        type: "string",
                      },
                      capacityOptionType: {
                        type: "string",
                      },
                      instanceMetadataTagsPropagation: {
                        type: "boolean",
                      },
                      instanceRequirements: {
                        type: "object",
                        properties: {
                          vCpuCount: {
                            type: "object",
                            properties: {
                              min: {},
                              max: {},
                            },
                            required: ["min"],
                            additionalProperties: false,
                          },
                          memoryMiB: {
                            type: "object",
                            properties: {
                              min: {},
                              max: {},
                            },
                            required: ["min"],
                            additionalProperties: false,
                          },
                          cpuManufacturers: {
                            type: "array",
                            items: {},
                          },
                          memoryGiBPerVCpu: {
                            type: "object",
                            properties: {
                              min: {},
                              max: {},
                            },
                            additionalProperties: false,
                          },
                          excludedInstanceTypes: {
                            type: "array",
                            items: {},
                          },
                          instanceGenerations: {
                            type: "array",
                            items: {},
                          },
                          spotMaxPricePercentageOverLowestPrice: {
                            type: "number",
                          },
                          onDemandMaxPricePercentageOverLowestPrice: {
                            type: "number",
                          },
                          bareMetal: {
                            type: "string",
                          },
                          burstablePerformance: {
                            type: "string",
                          },
                          requireHibernateSupport: {
                            type: "boolean",
                          },
                          networkInterfaceCount: {
                            type: "object",
                            properties: {
                              min: {},
                              max: {},
                            },
                            additionalProperties: false,
                          },
                          localStorage: {
                            type: "string",
                          },
                          localStorageTypes: {
                            type: "array",
                            items: {},
                          },
                          totalLocalStorageGB: {
                            type: "object",
                            properties: {
                              min: {},
                              max: {},
                            },
                            additionalProperties: false,
                          },
                          baselineEbsBandwidthMbps: {
                            type: "object",
                            properties: {
                              min: {},
                              max: {},
                            },
                            additionalProperties: false,
                          },
                          acceleratorTypes: {
                            type: "array",
                            items: {},
                          },
                          acceleratorCount: {
                            type: "object",
                            properties: {
                              min: {},
                              max: {},
                            },
                            additionalProperties: false,
                          },
                          acceleratorManufacturers: {
                            type: "array",
                            items: {},
                          },
                          acceleratorNames: {
                            type: "array",
                            items: {},
                          },
                          acceleratorTotalMemoryMiB: {
                            type: "object",
                            properties: {
                              min: {},
                              max: {},
                            },
                            additionalProperties: false,
                          },
                          networkBandwidthGbps: {
                            type: "object",
                            properties: {
                              min: {},
                              max: {},
                            },
                            additionalProperties: false,
                          },
                          allowedInstanceTypes: {
                            type: "array",
                            items: {},
                          },
                          maxSpotPriceAsPercentageOfOptimalOnDemandPrice: {
                            type: "number",
                          },
                        },
                        required: ["vCpuCount", "memoryMiB"],
                        additionalProperties: false,
                      },
                      fipsEnabled: {
                        type: "boolean",
                      },
                      capacityReservations: {
                        type: "object",
                        properties: {
                          reservationGroupArn: {
                            type: "string",
                          },
                          reservationPreference: {
                            type: "string",
                          },
                        },
                        additionalProperties: false,
                      },
                    },
                    required: ["ec2InstanceProfileArn", "networkConfiguration"],
                    additionalProperties: false,
                  },
                  propagateTags: {
                    type: "string",
                  },
                  infrastructureOptimization: {
                    type: "object",
                    properties: {
                      scaleInAfter: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  autoRepairConfiguration: {
                    type: "object",
                    properties: {
                      actionsStatus: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              updateStatus: {
                type: "string",
              },
              updateStatusReason: {
                type: "string",
              },
              tags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: {
                      type: "string",
                    },
                    value: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              type: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Details about the capacity provider.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateCapacityProvider;

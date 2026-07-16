import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, DeleteCapacityProviderCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteCapacityProvider: AppBlock = {
  name: "Delete Capacity Provider",
  description: `Deletes the specified capacity provider.`,
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
        capacityProvider: {
          name: "capacity Provider",
          description:
            "The short name or full Amazon Resource Name (ARN) of the capacity provider to delete.",
          type: "string",
          required: true,
        },
        cluster: {
          name: "cluster",
          description:
            "The name of the cluster that contains the capacity provider to delete.",
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

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeleteCapacityProviderCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Capacity Provider Result",
      description: "Result from DeleteCapacityProvider operation",
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
                enum: ["PROVISIONING", "ACTIVE", "DEPROVISIONING", "INACTIVE"],
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
                        enum: ["ENABLED", "DISABLED"],
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
                    enum: ["ENABLED", "DISABLED"],
                  },
                  managedDraining: {
                    type: "string",
                    enum: ["ENABLED", "DISABLED"],
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
                        enum: ["BASIC", "DETAILED"],
                      },
                      capacityOptionType: {
                        type: "string",
                        enum: ["ON_DEMAND", "SPOT", "RESERVED"],
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
                            enum: ["included", "required", "excluded"],
                          },
                          burstablePerformance: {
                            type: "string",
                            enum: ["included", "required", "excluded"],
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
                            enum: ["included", "required", "excluded"],
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
                            enum: [
                              "RESERVATIONS_ONLY",
                              "RESERVATIONS_FIRST",
                              "RESERVATIONS_EXCLUDED",
                            ],
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
                    enum: ["CAPACITY_PROVIDER", "NONE"],
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
                        enum: ["ENABLED", "DISABLED"],
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              updateStatus: {
                type: "string",
                enum: [
                  "CREATE_IN_PROGRESS",
                  "CREATE_COMPLETE",
                  "CREATE_FAILED",
                  "DELETE_IN_PROGRESS",
                  "DELETE_COMPLETE",
                  "DELETE_FAILED",
                  "UPDATE_IN_PROGRESS",
                  "UPDATE_COMPLETE",
                  "UPDATE_FAILED",
                ],
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
                enum: [
                  "EC2_AUTOSCALING",
                  "MANAGED_INSTANCES",
                  "FARGATE",
                  "FARGATE_SPOT",
                ],
              },
            },
            additionalProperties: false,
            description: "The details of the capacity provider.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteCapacityProvider;

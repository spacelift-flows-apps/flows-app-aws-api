import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECSClient,
  DescribeCapacityProvidersCommand,
} from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeCapacityProviders: AppBlock = {
  name: "Describe Capacity Providers",
  description: `Describes one or more of your capacity providers.`,
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
        capacityProviders: {
          name: "capacity Providers",
          description:
            "The short name or full Amazon Resource Name (ARN) of one or more capacity providers.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        cluster: {
          name: "cluster",
          description:
            "The name of the cluster to describe capacity providers for.",
          type: "string",
          required: false,
        },
        include: {
          name: "include",
          description:
            "Specifies whether or not you want to see the resource tags for the capacity provider.",
          type: {
            type: "array",
            items: {
              type: "string",
              enum: ["TAGS"],
            },
          },
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of account setting results returned by DescribeCapacityProviders in paginated output.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "The nextToken value returned from a previous paginated DescribeCapacityProviders request where maxResults was used and the results exceeded the value of that parameter.",
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

        const command = new DescribeCapacityProvidersCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Capacity Providers Result",
      description: "Result from DescribeCapacityProviders operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          capacityProviders: {
            type: "array",
            items: {
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
                  enum: [
                    "PROVISIONING",
                    "ACTIVE",
                    "DEPROVISIONING",
                    "INACTIVE",
                  ],
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
                            subnets: {},
                            securityGroups: {},
                          },
                          additionalProperties: false,
                        },
                        storageConfiguration: {
                          type: "object",
                          properties: {
                            storageSizeGiB: {},
                          },
                          additionalProperties: false,
                        },
                        localStorageConfiguration: {
                          type: "object",
                          properties: {
                            useLocalStorage: {},
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
                            vCpuCount: {},
                            memoryMiB: {},
                            cpuManufacturers: {},
                            memoryGiBPerVCpu: {},
                            excludedInstanceTypes: {},
                            instanceGenerations: {},
                            spotMaxPricePercentageOverLowestPrice: {},
                            onDemandMaxPricePercentageOverLowestPrice: {},
                            bareMetal: {},
                            burstablePerformance: {},
                            requireHibernateSupport: {},
                            networkInterfaceCount: {},
                            localStorage: {},
                            localStorageTypes: {},
                            totalLocalStorageGB: {},
                            baselineEbsBandwidthMbps: {},
                            acceleratorTypes: {},
                            acceleratorCount: {},
                            acceleratorManufacturers: {},
                            acceleratorNames: {},
                            acceleratorTotalMemoryMiB: {},
                            networkBandwidthGbps: {},
                            allowedInstanceTypes: {},
                            maxSpotPriceAsPercentageOfOptimalOnDemandPrice: {},
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
                            reservationGroupArn: {},
                            reservationPreference: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      required: [
                        "ec2InstanceProfileArn",
                        "networkConfiguration",
                      ],
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
            },
            description: "The list of capacity providers.",
          },
          failures: {
            type: "array",
            items: {
              type: "object",
              properties: {
                arn: {
                  type: "string",
                },
                reason: {
                  type: "string",
                },
                detail: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Any failures associated with the call.",
          },
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future DescribeCapacityProviders request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeCapacityProviders;

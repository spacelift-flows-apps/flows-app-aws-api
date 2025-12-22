import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, DescribeServicesCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeServices: AppBlock = {
  name: "Describe Services",
  description: `Describes the specified services running in your cluster.`,
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
        cluster: {
          name: "cluster",
          description:
            "The short name or full Amazon Resource Name (ARN)the cluster that hosts the service to describe.",
          type: "string",
          required: false,
        },
        services: {
          name: "services",
          description: "A list of services to describe.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        include: {
          name: "include",
          description:
            "Determines whether you want to see the resource tags for the service.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
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

        const command = new DescribeServicesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Services Result",
      description: "Result from DescribeServices operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          services: {
            type: "array",
            items: {
              type: "object",
              properties: {
                serviceArn: {
                  type: "string",
                },
                serviceName: {
                  type: "string",
                },
                clusterArn: {
                  type: "string",
                },
                loadBalancers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      targetGroupArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      loadBalancerName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      containerName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      containerPort: {
                        type: "object",
                        additionalProperties: true,
                      },
                      advancedConfiguration: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                serviceRegistries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      registryArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      port: {
                        type: "object",
                        additionalProperties: true,
                      },
                      containerName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      containerPort: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                status: {
                  type: "string",
                },
                desiredCount: {
                  type: "number",
                },
                runningCount: {
                  type: "number",
                },
                pendingCount: {
                  type: "number",
                },
                launchType: {
                  type: "string",
                },
                capacityProviderStrategy: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      capacityProvider: {
                        type: "object",
                        additionalProperties: true,
                      },
                      weight: {
                        type: "object",
                        additionalProperties: true,
                      },
                      base: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["capacityProvider"],
                    additionalProperties: false,
                  },
                },
                platformVersion: {
                  type: "string",
                },
                platformFamily: {
                  type: "string",
                },
                taskDefinition: {
                  type: "string",
                },
                deploymentConfiguration: {
                  type: "object",
                  properties: {
                    deploymentCircuitBreaker: {
                      type: "object",
                      properties: {
                        enable: {
                          type: "object",
                          additionalProperties: true,
                        },
                        rollback: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["enable", "rollback"],
                      additionalProperties: false,
                    },
                    maximumPercent: {
                      type: "number",
                    },
                    minimumHealthyPercent: {
                      type: "number",
                    },
                    alarms: {
                      type: "object",
                      properties: {
                        alarmNames: {
                          type: "object",
                          additionalProperties: true,
                        },
                        rollback: {
                          type: "object",
                          additionalProperties: true,
                        },
                        enable: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["alarmNames", "rollback", "enable"],
                      additionalProperties: false,
                    },
                    strategy: {
                      type: "string",
                    },
                    bakeTimeInMinutes: {
                      type: "number",
                    },
                    lifecycleHooks: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                taskSets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "object",
                        additionalProperties: true,
                      },
                      taskSetArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      serviceArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      clusterArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      startedBy: {
                        type: "object",
                        additionalProperties: true,
                      },
                      externalId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      status: {
                        type: "object",
                        additionalProperties: true,
                      },
                      taskDefinition: {
                        type: "object",
                        additionalProperties: true,
                      },
                      computedDesiredCount: {
                        type: "object",
                        additionalProperties: true,
                      },
                      pendingCount: {
                        type: "object",
                        additionalProperties: true,
                      },
                      runningCount: {
                        type: "object",
                        additionalProperties: true,
                      },
                      createdAt: {
                        type: "object",
                        additionalProperties: true,
                      },
                      updatedAt: {
                        type: "object",
                        additionalProperties: true,
                      },
                      launchType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      capacityProviderStrategy: {
                        type: "object",
                        additionalProperties: true,
                      },
                      platformVersion: {
                        type: "object",
                        additionalProperties: true,
                      },
                      platformFamily: {
                        type: "object",
                        additionalProperties: true,
                      },
                      networkConfiguration: {
                        type: "object",
                        additionalProperties: true,
                      },
                      loadBalancers: {
                        type: "object",
                        additionalProperties: true,
                      },
                      serviceRegistries: {
                        type: "object",
                        additionalProperties: true,
                      },
                      scale: {
                        type: "object",
                        additionalProperties: true,
                      },
                      stabilityStatus: {
                        type: "object",
                        additionalProperties: true,
                      },
                      stabilityStatusAt: {
                        type: "object",
                        additionalProperties: true,
                      },
                      tags: {
                        type: "object",
                        additionalProperties: true,
                      },
                      fargateEphemeralStorage: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                deployments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "object",
                        additionalProperties: true,
                      },
                      status: {
                        type: "object",
                        additionalProperties: true,
                      },
                      taskDefinition: {
                        type: "object",
                        additionalProperties: true,
                      },
                      desiredCount: {
                        type: "object",
                        additionalProperties: true,
                      },
                      pendingCount: {
                        type: "object",
                        additionalProperties: true,
                      },
                      runningCount: {
                        type: "object",
                        additionalProperties: true,
                      },
                      failedTasks: {
                        type: "object",
                        additionalProperties: true,
                      },
                      createdAt: {
                        type: "object",
                        additionalProperties: true,
                      },
                      updatedAt: {
                        type: "object",
                        additionalProperties: true,
                      },
                      capacityProviderStrategy: {
                        type: "object",
                        additionalProperties: true,
                      },
                      launchType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      platformVersion: {
                        type: "object",
                        additionalProperties: true,
                      },
                      platformFamily: {
                        type: "object",
                        additionalProperties: true,
                      },
                      networkConfiguration: {
                        type: "object",
                        additionalProperties: true,
                      },
                      rolloutState: {
                        type: "object",
                        additionalProperties: true,
                      },
                      rolloutStateReason: {
                        type: "object",
                        additionalProperties: true,
                      },
                      serviceConnectConfiguration: {
                        type: "object",
                        additionalProperties: true,
                      },
                      serviceConnectResources: {
                        type: "object",
                        additionalProperties: true,
                      },
                      volumeConfigurations: {
                        type: "object",
                        additionalProperties: true,
                      },
                      fargateEphemeralStorage: {
                        type: "object",
                        additionalProperties: true,
                      },
                      vpcLatticeConfigurations: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                roleArn: {
                  type: "string",
                },
                events: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "object",
                        additionalProperties: true,
                      },
                      createdAt: {
                        type: "object",
                        additionalProperties: true,
                      },
                      message: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                createdAt: {
                  type: "string",
                },
                placementConstraints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: {
                        type: "object",
                        additionalProperties: true,
                      },
                      expression: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                placementStrategy: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: {
                        type: "object",
                        additionalProperties: true,
                      },
                      field: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                networkConfiguration: {
                  type: "object",
                  properties: {
                    awsvpcConfiguration: {
                      type: "object",
                      properties: {
                        subnets: {
                          type: "object",
                          additionalProperties: true,
                        },
                        securityGroups: {
                          type: "object",
                          additionalProperties: true,
                        },
                        assignPublicIp: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["subnets"],
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                healthCheckGracePeriodSeconds: {
                  type: "number",
                },
                schedulingStrategy: {
                  type: "string",
                },
                deploymentController: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                    },
                  },
                  required: ["type"],
                  additionalProperties: false,
                },
                tags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                createdBy: {
                  type: "string",
                },
                enableECSManagedTags: {
                  type: "boolean",
                },
                propagateTags: {
                  type: "string",
                },
                enableExecuteCommand: {
                  type: "boolean",
                },
                availabilityZoneRebalancing: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The list of services described.",
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
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeServices;

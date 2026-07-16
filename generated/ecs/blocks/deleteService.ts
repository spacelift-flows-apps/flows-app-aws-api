import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, DeleteServiceCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteService: AppBlock = {
  name: "Delete Service",
  description: `Deletes a specified service within a cluster.`,
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
            "The short name or full Amazon Resource Name (ARN) of the cluster that hosts the service to delete.",
          type: "string",
          required: false,
        },
        service: {
          name: "service",
          description: "The name of the service to delete.",
          type: "string",
          required: true,
        },
        force: {
          name: "force",
          description:
            "If true, allows you to delete a service even if it wasn't scaled down to zero tasks.",
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

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeleteServiceCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Service Result",
      description: "Result from DeleteService operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          service: {
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
                      type: "string",
                    },
                    loadBalancerName: {
                      type: "string",
                    },
                    containerName: {
                      type: "string",
                    },
                    containerPort: {
                      type: "number",
                    },
                    advancedConfiguration: {
                      type: "object",
                      properties: {
                        alternateTargetGroupArn: {
                          type: "string",
                        },
                        productionListenerRule: {
                          type: "string",
                        },
                        testListenerRule: {
                          type: "string",
                        },
                        roleArn: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
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
                      type: "string",
                    },
                    port: {
                      type: "number",
                    },
                    containerName: {
                      type: "string",
                    },
                    containerPort: {
                      type: "number",
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
                      type: "string",
                    },
                    weight: {
                      type: "number",
                    },
                    base: {
                      type: "number",
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
                        type: "boolean",
                      },
                      rollback: {
                        type: "boolean",
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
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                      rollback: {
                        type: "boolean",
                      },
                      enable: {
                        type: "boolean",
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
                      properties: {
                        hookTargetArn: {
                          type: "string",
                        },
                        roleArn: {
                          type: "string",
                        },
                        lifecycleStages: {
                          type: "array",
                          items: {},
                        },
                        hookDetails: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  linearConfiguration: {
                    type: "object",
                    properties: {
                      stepPercent: {
                        type: "number",
                      },
                      stepBakeTimeInMinutes: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  canaryConfiguration: {
                    type: "object",
                    properties: {
                      canaryPercent: {
                        type: "number",
                      },
                      canaryBakeTimeInMinutes: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
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
                      type: "string",
                    },
                    taskSetArn: {
                      type: "string",
                    },
                    serviceArn: {
                      type: "string",
                    },
                    clusterArn: {
                      type: "string",
                    },
                    startedBy: {
                      type: "string",
                    },
                    externalId: {
                      type: "string",
                    },
                    status: {
                      type: "string",
                    },
                    taskDefinition: {
                      type: "string",
                    },
                    computedDesiredCount: {
                      type: "number",
                    },
                    pendingCount: {
                      type: "number",
                    },
                    runningCount: {
                      type: "number",
                    },
                    createdAt: {
                      type: "string",
                    },
                    updatedAt: {
                      type: "string",
                    },
                    launchType: {
                      type: "string",
                    },
                    capacityProviderStrategy: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          capacityProvider: {},
                          weight: {},
                          base: {},
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
                    networkConfiguration: {
                      type: "object",
                      properties: {
                        awsvpcConfiguration: {
                          type: "object",
                          properties: {
                            subnets: {},
                            securityGroups: {},
                            assignPublicIp: {},
                          },
                          required: ["subnets"],
                          additionalProperties: false,
                        },
                      },
                      additionalProperties: false,
                    },
                    loadBalancers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          targetGroupArn: {},
                          loadBalancerName: {},
                          containerName: {},
                          containerPort: {},
                          advancedConfiguration: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    serviceRegistries: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          registryArn: {},
                          port: {},
                          containerName: {},
                          containerPort: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    scale: {
                      type: "object",
                      properties: {
                        value: {
                          type: "number",
                        },
                        unit: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                    stabilityStatus: {
                      type: "string",
                    },
                    stabilityStatusAt: {
                      type: "string",
                    },
                    tags: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          key: {},
                          value: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    fargateEphemeralStorage: {
                      type: "object",
                      properties: {
                        kmsKeyId: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
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
                      type: "string",
                    },
                    status: {
                      type: "string",
                    },
                    taskDefinition: {
                      type: "string",
                    },
                    desiredCount: {
                      type: "number",
                    },
                    pendingCount: {
                      type: "number",
                    },
                    runningCount: {
                      type: "number",
                    },
                    failedTasks: {
                      type: "number",
                    },
                    createdAt: {
                      type: "string",
                    },
                    updatedAt: {
                      type: "string",
                    },
                    capacityProviderStrategy: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          capacityProvider: {},
                          weight: {},
                          base: {},
                        },
                        required: ["capacityProvider"],
                        additionalProperties: false,
                      },
                    },
                    launchType: {
                      type: "string",
                    },
                    platformVersion: {
                      type: "string",
                    },
                    platformFamily: {
                      type: "string",
                    },
                    networkConfiguration: {
                      type: "object",
                      properties: {
                        awsvpcConfiguration: {
                          type: "object",
                          properties: {
                            subnets: {},
                            securityGroups: {},
                            assignPublicIp: {},
                          },
                          required: ["subnets"],
                          additionalProperties: false,
                        },
                      },
                      additionalProperties: false,
                    },
                    rolloutState: {
                      type: "string",
                    },
                    rolloutStateReason: {
                      type: "string",
                    },
                    serviceConnectConfiguration: {
                      type: "object",
                      properties: {
                        enabled: {
                          type: "boolean",
                        },
                        namespace: {
                          type: "string",
                        },
                        services: {
                          type: "array",
                          items: {},
                        },
                        logConfiguration: {
                          type: "object",
                          properties: {
                            logDriver: {},
                            options: {},
                            secretOptions: {},
                          },
                          required: ["logDriver"],
                          additionalProperties: false,
                        },
                        accessLogConfiguration: {
                          type: "object",
                          properties: {
                            format: {},
                            includeQueryParameters: {},
                          },
                          required: ["format"],
                          additionalProperties: false,
                        },
                      },
                      required: ["enabled"],
                      additionalProperties: false,
                    },
                    serviceConnectResources: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          discoveryName: {},
                          discoveryArn: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    volumeConfigurations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: {},
                          managedEBSVolume: {},
                        },
                        required: ["name"],
                        additionalProperties: false,
                      },
                    },
                    fargateEphemeralStorage: {
                      type: "object",
                      properties: {
                        kmsKeyId: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                    vpcLatticeConfigurations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          roleArn: {},
                          targetGroupArn: {},
                          portName: {},
                        },
                        required: ["roleArn", "targetGroupArn", "portName"],
                        additionalProperties: false,
                      },
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
                      type: "string",
                    },
                    createdAt: {
                      type: "string",
                    },
                    message: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              createdAt: {
                type: "string",
              },
              currentServiceDeployment: {
                type: "string",
              },
              currentServiceRevisions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    arn: {
                      type: "string",
                    },
                    requestedTaskCount: {
                      type: "number",
                    },
                    runningTaskCount: {
                      type: "number",
                    },
                    pendingTaskCount: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
              },
              placementConstraints: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                    },
                    expression: {
                      type: "string",
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
                      type: "string",
                    },
                    field: {
                      type: "string",
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
                      assignPublicIp: {
                        type: "string",
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
                      type: "string",
                    },
                    value: {
                      type: "string",
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
              resourceManagementType: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The full description of the deleted service.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteService;

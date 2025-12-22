import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, UpdateServiceCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateService: AppBlock = {
  name: "Update Service",
  description: `Modifies the parameters of a service.`,
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
            "The short name or full Amazon Resource Name (ARN) of the cluster that your service runs on.",
          type: "string",
          required: false,
        },
        service: {
          name: "service",
          description: "The name of the service to update.",
          type: "string",
          required: true,
        },
        desiredCount: {
          name: "desired Count",
          description:
            "The number of instantiations of the task to place and keep running in your service.",
          type: "number",
          required: false,
        },
        taskDefinition: {
          name: "task Definition",
          description:
            "The family and revision (family:revision) or full ARN of the task definition to run in your service.",
          type: "string",
          required: false,
        },
        capacityProviderStrategy: {
          name: "capacity Provider Strategy",
          description: "The details of a capacity provider strategy.",
          type: {
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
          required: false,
        },
        deploymentConfiguration: {
          name: "deployment Configuration",
          description:
            "Optional deployment parameters that control how many tasks run during the deployment and the ordering of stopping and starting tasks.",
          type: {
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
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        availabilityZoneRebalancing: {
          name: "availability Zone Rebalancing",
          description:
            "Indicates whether to use Availability Zone rebalancing for the service.",
          type: "string",
          required: false,
        },
        networkConfiguration: {
          name: "network Configuration",
          description:
            "An object representing the network configuration for the service.",
          type: {
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
          required: false,
        },
        placementConstraints: {
          name: "placement Constraints",
          description:
            "An array of task placement constraint objects to update the service to use.",
          type: {
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
          required: false,
        },
        placementStrategy: {
          name: "placement Strategy",
          description:
            "The task placement strategy objects to update the service to use.",
          type: {
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
          required: false,
        },
        platformVersion: {
          name: "platform Version",
          description:
            "The platform version that your tasks in the service run on.",
          type: "string",
          required: false,
        },
        forceNewDeployment: {
          name: "force New Deployment",
          description:
            "Determines whether to force a new deployment of the service.",
          type: "boolean",
          required: false,
        },
        healthCheckGracePeriodSeconds: {
          name: "health Check Grace Period Seconds",
          description:
            "The period of time, in seconds, that the Amazon ECS service scheduler ignores unhealthy Elastic Load Balancing, VPC Lattice, and container health checks after a task has first started.",
          type: "number",
          required: false,
        },
        deploymentController: {
          name: "deployment Controller",
          description: "The deployment controller to use for the service.",
          type: {
            type: "object",
            properties: {
              type: {
                type: "string",
              },
            },
            required: ["type"],
            additionalProperties: false,
          },
          required: false,
        },
        enableExecuteCommand: {
          name: "enable Execute Command",
          description:
            "If true, this enables execute command functionality on all task containers.",
          type: "boolean",
          required: false,
        },
        enableECSManagedTags: {
          name: "enable ECS Managed Tags",
          description:
            "Determines whether to turn on Amazon ECS managed tags for the tasks in the service.",
          type: "boolean",
          required: false,
        },
        loadBalancers: {
          name: "load Balancers",
          description:
            "You must have a service-linked role when you update this property A list of Elastic Load Balancing load balancer objects.",
          type: {
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
          required: false,
        },
        propagateTags: {
          name: "propagate Tags",
          description:
            "Determines whether to propagate the tags from the task definition or the service to the task.",
          type: "string",
          required: false,
        },
        serviceRegistries: {
          name: "service Registries",
          description:
            "You must have a service-linked role when you update this property.",
          type: {
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
          required: false,
        },
        serviceConnectConfiguration: {
          name: "service Connect Configuration",
          description:
            "The configuration for this service to discover and connect to services, and be discovered by, and connected from, other services within a namespace.",
          type: {
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
                items: {
                  type: "object",
                  properties: {
                    portName: {
                      type: "string",
                    },
                    discoveryName: {
                      type: "string",
                    },
                    clientAliases: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    ingressPortOverride: {
                      type: "number",
                    },
                    timeout: {
                      type: "object",
                      properties: {
                        idleTimeoutSeconds: {
                          type: "object",
                          additionalProperties: true,
                        },
                        perRequestTimeoutSeconds: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    tls: {
                      type: "object",
                      properties: {
                        issuerCertificateAuthority: {
                          type: "object",
                          additionalProperties: true,
                        },
                        kmsKey: {
                          type: "object",
                          additionalProperties: true,
                        },
                        roleArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["issuerCertificateAuthority"],
                      additionalProperties: false,
                    },
                  },
                  required: ["portName"],
                  additionalProperties: false,
                },
              },
              logConfiguration: {
                type: "object",
                properties: {
                  logDriver: {
                    type: "string",
                  },
                  options: {
                    type: "object",
                    additionalProperties: {
                      type: "string",
                    },
                  },
                  secretOptions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: {
                          type: "object",
                          additionalProperties: true,
                        },
                        valueFrom: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["name", "valueFrom"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["logDriver"],
                additionalProperties: false,
              },
            },
            required: ["enabled"],
            additionalProperties: false,
          },
          required: false,
        },
        volumeConfigurations: {
          name: "volume Configurations",
          description: "The details of the volume that was configuredAtLaunch.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                managedEBSVolume: {
                  type: "object",
                  properties: {
                    encrypted: {
                      type: "boolean",
                    },
                    kmsKeyId: {
                      type: "string",
                    },
                    volumeType: {
                      type: "string",
                    },
                    sizeInGiB: {
                      type: "number",
                    },
                    snapshotId: {
                      type: "string",
                    },
                    volumeInitializationRate: {
                      type: "number",
                    },
                    iops: {
                      type: "number",
                    },
                    throughput: {
                      type: "number",
                    },
                    tagSpecifications: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    roleArn: {
                      type: "string",
                    },
                    filesystemType: {
                      type: "string",
                    },
                  },
                  required: ["roleArn"],
                  additionalProperties: false,
                },
              },
              required: ["name"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        vpcLatticeConfigurations: {
          name: "vpc Lattice Configurations",
          description:
            "An object representing the VPC Lattice configuration for the service being updated.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                roleArn: {
                  type: "string",
                },
                targetGroupArn: {
                  type: "string",
                },
                portName: {
                  type: "string",
                },
              },
              required: ["roleArn", "targetGroupArn", "portName"],
              additionalProperties: false,
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

        const command = new UpdateServiceCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Service Result",
      description: "Result from UpdateService operation",
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
                          type: "object",
                          additionalProperties: true,
                        },
                        productionListenerRule: {
                          type: "object",
                          additionalProperties: true,
                        },
                        testListenerRule: {
                          type: "object",
                          additionalProperties: true,
                        },
                        roleArn: {
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
                          type: "object",
                          additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        roleArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        lifecycleStages: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
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
                        additionalProperties: true,
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
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    loadBalancers: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    serviceRegistries: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    scale: {
                      type: "object",
                      properties: {
                        value: {
                          type: "object",
                          additionalProperties: true,
                        },
                        unit: {
                          type: "object",
                          additionalProperties: true,
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
                        additionalProperties: true,
                      },
                    },
                    fargateEphemeralStorage: {
                      type: "object",
                      properties: {
                        kmsKeyId: {
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
                        additionalProperties: true,
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
                          additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        namespace: {
                          type: "object",
                          additionalProperties: true,
                        },
                        services: {
                          type: "object",
                          additionalProperties: true,
                        },
                        logConfiguration: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["enabled"],
                      additionalProperties: false,
                    },
                    serviceConnectResources: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    volumeConfigurations: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    fargateEphemeralStorage: {
                      type: "object",
                      properties: {
                        kmsKeyId: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    vpcLatticeConfigurations: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      securityGroups: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
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
            },
            additionalProperties: false,
            description:
              "The full description of your service following the update call.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateService;

import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, CreateServiceCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createService: AppBlock = {
  name: "Create Service",
  description: `Runs and maintains your desired number of tasks from a specified task definition.`,
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
            "The short name or full Amazon Resource Name (ARN) of the cluster that you run your service on.",
          type: "string",
          required: false,
        },
        serviceName: {
          name: "service Name",
          description: "The name of your service.",
          type: "string",
          required: true,
        },
        taskDefinition: {
          name: "task Definition",
          description:
            "The family and revision (family:revision) or full ARN of the task definition to run in your service.",
          type: "string",
          required: false,
        },
        availabilityZoneRebalancing: {
          name: "availability Zone Rebalancing",
          description:
            "Indicates whether to use Availability Zone rebalancing for the service.",
          type: "string",
          required: false,
        },
        loadBalancers: {
          name: "load Balancers",
          description:
            "A load balancer object representing the load balancers to use with your service.",
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
        serviceRegistries: {
          name: "service Registries",
          description:
            "The details of the service discovery registry to associate with this service.",
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
        desiredCount: {
          name: "desired Count",
          description:
            "The number of instantiations of the specified task definition to place and keep running in your service.",
          type: "number",
          required: false,
        },
        clientToken: {
          name: "client Token",
          description:
            "An identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        launchType: {
          name: "launch Type",
          description: "The infrastructure that you run your service on.",
          type: "string",
          required: false,
        },
        capacityProviderStrategy: {
          name: "capacity Provider Strategy",
          description: "The capacity provider strategy to use for the service.",
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
        platformVersion: {
          name: "platform Version",
          description:
            "The platform version that your tasks in the service are running on.",
          type: "string",
          required: false,
        },
        role: {
          name: "role",
          description:
            "The name or full Amazon Resource Name (ARN) of the IAM role that allows Amazon ECS to make calls to your load balancer on your behalf.",
          type: "string",
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
                        type: "string",
                      },
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
          required: false,
        },
        placementConstraints: {
          name: "placement Constraints",
          description:
            "An array of placement constraint objects to use for tasks in your service.",
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
            "The placement strategy objects to use for tasks in your service.",
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
        networkConfiguration: {
          name: "network Configuration",
          description: "The network configuration for the service.",
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
        healthCheckGracePeriodSeconds: {
          name: "health Check Grace Period Seconds",
          description:
            "The period of time, in seconds, that the Amazon ECS service scheduler ignores unhealthy Elastic Load Balancing, VPC Lattice, and container health checks after a task has first started.",
          type: "number",
          required: false,
        },
        schedulingStrategy: {
          name: "scheduling Strategy",
          description: "The scheduling strategy to use for the service.",
          type: "string",
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
        tags: {
          name: "tags",
          description:
            "The metadata that you apply to the service to help you categorize and organize them.",
          type: {
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
          required: false,
        },
        enableECSManagedTags: {
          name: "enable ECS Managed Tags",
          description:
            "Specifies whether to turn on Amazon ECS managed tags for the tasks within the service.",
          type: "boolean",
          required: false,
        },
        propagateTags: {
          name: "propagate Tags",
          description:
            "Specifies whether to propagate the tags from the task definition to the task.",
          type: "string",
          required: false,
        },
        enableExecuteCommand: {
          name: "enable Execute Command",
          description:
            "Determines whether the execute command functionality is turned on for the service.",
          type: "boolean",
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
                        properties: {
                          port: {},
                          dnsName: {},
                          testTrafficRules: {},
                        },
                        required: ["port"],
                        additionalProperties: false,
                      },
                    },
                    ingressPortOverride: {
                      type: "number",
                    },
                    timeout: {
                      type: "object",
                      properties: {
                        idleTimeoutSeconds: {
                          type: "number",
                        },
                        perRequestTimeoutSeconds: {
                          type: "number",
                        },
                      },
                      additionalProperties: false,
                    },
                    tls: {
                      type: "object",
                      properties: {
                        issuerCertificateAuthority: {
                          type: "object",
                          properties: {
                            awsPcaAuthorityArn: {},
                          },
                          additionalProperties: false,
                        },
                        kmsKey: {
                          type: "string",
                        },
                        roleArn: {
                          type: "string",
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
                          type: "string",
                        },
                        valueFrom: {
                          type: "string",
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
              accessLogConfiguration: {
                type: "object",
                properties: {
                  format: {
                    type: "string",
                  },
                  includeQueryParameters: {
                    type: "string",
                  },
                },
                required: ["format"],
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
          description:
            "The configuration for a volume specified in the task definition as a volume that is configured at launch time.",
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
                        properties: {
                          resourceType: {},
                          tags: {},
                          propagateTags: {},
                        },
                        required: ["resourceType"],
                        additionalProperties: false,
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
            "The VPC Lattice configuration for the service being created.",
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

        const command = new CreateServiceCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Service Result",
      description: "Result from CreateService operation",
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
            description:
              "The full description of your service following the create call.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createService;

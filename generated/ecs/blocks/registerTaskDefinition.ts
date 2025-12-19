import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, RegisterTaskDefinitionCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const registerTaskDefinition: AppBlock = {
  name: "Register Task Definition",
  description: `Registers a new task definition from the supplied family and containerDefinitions.`,
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
        family: {
          name: "family",
          description: "You must specify a family for a task definition.",
          type: "string",
          required: true,
        },
        taskRoleArn: {
          name: "task Role Arn",
          description:
            "The short name or full Amazon Resource Name (ARN) of the IAM role that containers in this task can assume.",
          type: "string",
          required: false,
        },
        executionRoleArn: {
          name: "execution Role Arn",
          description:
            "The Amazon Resource Name (ARN) of the task execution role that grants the Amazon ECS container agent permission to make Amazon Web Services API calls on your behalf.",
          type: "string",
          required: false,
        },
        networkMode: {
          name: "network Mode",
          description:
            "The Docker networking mode to use for the containers in the task.",
          type: "string",
          required: false,
        },
        containerDefinitions: {
          name: "container Definitions",
          description:
            "A list of container definitions in JSON format that describe the different containers that make up your task.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                image: {
                  type: "string",
                },
                repositoryCredentials: {
                  type: "object",
                  properties: {
                    credentialsParameter: {
                      type: "string",
                    },
                  },
                  required: ["credentialsParameter"],
                  additionalProperties: false,
                },
                cpu: {
                  type: "number",
                },
                memory: {
                  type: "number",
                },
                memoryReservation: {
                  type: "number",
                },
                links: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                portMappings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      containerPort: {
                        type: "object",
                        additionalProperties: true,
                      },
                      hostPort: {
                        type: "object",
                        additionalProperties: true,
                      },
                      protocol: {
                        type: "object",
                        additionalProperties: true,
                      },
                      name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      appProtocol: {
                        type: "object",
                        additionalProperties: true,
                      },
                      containerPortRange: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                essential: {
                  type: "boolean",
                },
                restartPolicy: {
                  type: "object",
                  properties: {
                    enabled: {
                      type: "boolean",
                    },
                    ignoredExitCodes: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    restartAttemptPeriod: {
                      type: "number",
                    },
                  },
                  required: ["enabled"],
                  additionalProperties: false,
                },
                entryPoint: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                command: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                environment: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
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
                environmentFiles: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      value: {
                        type: "object",
                        additionalProperties: true,
                      },
                      type: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["value", "type"],
                    additionalProperties: false,
                  },
                },
                mountPoints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      sourceVolume: {
                        type: "object",
                        additionalProperties: true,
                      },
                      containerPath: {
                        type: "object",
                        additionalProperties: true,
                      },
                      readOnly: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                volumesFrom: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      sourceContainer: {
                        type: "object",
                        additionalProperties: true,
                      },
                      readOnly: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                linuxParameters: {
                  type: "object",
                  properties: {
                    capabilities: {
                      type: "object",
                      properties: {
                        add: {
                          type: "object",
                          additionalProperties: true,
                        },
                        drop: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    devices: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    initProcessEnabled: {
                      type: "boolean",
                    },
                    sharedMemorySize: {
                      type: "number",
                    },
                    tmpfs: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    maxSwap: {
                      type: "number",
                    },
                    swappiness: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                secrets: {
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
                dependsOn: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      containerName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      condition: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["containerName", "condition"],
                    additionalProperties: false,
                  },
                },
                startTimeout: {
                  type: "number",
                },
                stopTimeout: {
                  type: "number",
                },
                versionConsistency: {
                  type: "string",
                },
                hostname: {
                  type: "string",
                },
                user: {
                  type: "string",
                },
                workingDirectory: {
                  type: "string",
                },
                disableNetworking: {
                  type: "boolean",
                },
                privileged: {
                  type: "boolean",
                },
                readonlyRootFilesystem: {
                  type: "boolean",
                },
                dnsServers: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                dnsSearchDomains: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                extraHosts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      hostname: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ipAddress: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["hostname", "ipAddress"],
                    additionalProperties: false,
                  },
                },
                dockerSecurityOptions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                interactive: {
                  type: "boolean",
                },
                pseudoTerminal: {
                  type: "boolean",
                },
                dockerLabels: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
                ulimits: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      softLimit: {
                        type: "object",
                        additionalProperties: true,
                      },
                      hardLimit: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["name", "softLimit", "hardLimit"],
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
                        type: "object",
                      },
                    },
                    secretOptions: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["logDriver"],
                  additionalProperties: false,
                },
                healthCheck: {
                  type: "object",
                  properties: {
                    command: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    interval: {
                      type: "number",
                    },
                    timeout: {
                      type: "number",
                    },
                    retries: {
                      type: "number",
                    },
                    startPeriod: {
                      type: "number",
                    },
                  },
                  required: ["command"],
                  additionalProperties: false,
                },
                systemControls: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      namespace: {
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
                resourceRequirements: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      value: {
                        type: "object",
                        additionalProperties: true,
                      },
                      type: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["value", "type"],
                    additionalProperties: false,
                  },
                },
                firelensConfiguration: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                    },
                    options: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                  },
                  required: ["type"],
                  additionalProperties: false,
                },
                credentialSpecs: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: true,
        },
        volumes: {
          name: "volumes",
          description:
            "A list of volume definitions in JSON format that containers in your task might use.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                host: {
                  type: "object",
                  properties: {
                    sourcePath: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                dockerVolumeConfiguration: {
                  type: "object",
                  properties: {
                    scope: {
                      type: "string",
                    },
                    autoprovision: {
                      type: "boolean",
                    },
                    driver: {
                      type: "string",
                    },
                    driverOpts: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                    labels: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                  },
                  additionalProperties: false,
                },
                efsVolumeConfiguration: {
                  type: "object",
                  properties: {
                    fileSystemId: {
                      type: "string",
                    },
                    rootDirectory: {
                      type: "string",
                    },
                    transitEncryption: {
                      type: "string",
                    },
                    transitEncryptionPort: {
                      type: "number",
                    },
                    authorizationConfig: {
                      type: "object",
                      properties: {
                        accessPointId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        iam: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["fileSystemId"],
                  additionalProperties: false,
                },
                fsxWindowsFileServerVolumeConfiguration: {
                  type: "object",
                  properties: {
                    fileSystemId: {
                      type: "string",
                    },
                    rootDirectory: {
                      type: "string",
                    },
                    authorizationConfig: {
                      type: "object",
                      properties: {
                        credentialsParameter: {
                          type: "object",
                          additionalProperties: true,
                        },
                        domain: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["credentialsParameter", "domain"],
                      additionalProperties: false,
                    },
                  },
                  required: [
                    "fileSystemId",
                    "rootDirectory",
                    "authorizationConfig",
                  ],
                  additionalProperties: false,
                },
                configuredAtLaunch: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        placementConstraints: {
          name: "placement Constraints",
          description:
            "An array of placement constraint objects to use for the task.",
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
        requiresCompatibilities: {
          name: "requires Compatibilities",
          description:
            "The task launch type that Amazon ECS validates the task definition against.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        cpu: {
          name: "cpu",
          description: "The number of CPU units used by the task.",
          type: "string",
          required: false,
        },
        memory: {
          name: "memory",
          description: "The amount of memory (in MiB) used by the task.",
          type: "string",
          required: false,
        },
        tags: {
          name: "tags",
          description:
            "The metadata that you apply to the task definition to help you categorize and organize them.",
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
        pidMode: {
          name: "pid Mode",
          description:
            "The process namespace to use for the containers in the task.",
          type: "string",
          required: false,
        },
        ipcMode: {
          name: "ipc Mode",
          description:
            "The IPC resource namespace to use for the containers in the task.",
          type: "string",
          required: false,
        },
        proxyConfiguration: {
          name: "proxy Configuration",
          description: "The configuration details for the App Mesh proxy.",
          type: {
            type: "object",
            properties: {
              type: {
                type: "string",
              },
              containerName: {
                type: "string",
              },
              properties: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    value: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            required: ["containerName"],
            additionalProperties: false,
          },
          required: false,
        },
        inferenceAccelerators: {
          name: "inference Accelerators",
          description:
            "The Elastic Inference accelerators to use for the containers in the task.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                deviceName: {
                  type: "string",
                },
                deviceType: {
                  type: "string",
                },
              },
              required: ["deviceName", "deviceType"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        ephemeralStorage: {
          name: "ephemeral Storage",
          description:
            "The amount of ephemeral storage to allocate for the task.",
          type: {
            type: "object",
            properties: {
              sizeInGiB: {
                type: "number",
              },
            },
            required: ["sizeInGiB"],
            additionalProperties: false,
          },
          required: false,
        },
        runtimePlatform: {
          name: "runtime Platform",
          description:
            "The operating system that your tasks definitions run on.",
          type: {
            type: "object",
            properties: {
              cpuArchitecture: {
                type: "string",
              },
              operatingSystemFamily: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        enableFaultInjection: {
          name: "enable Fault Injection",
          description:
            "Enables fault injection when you register your task definition and allows for fault injection requests to be accepted from the task's containers.",
          type: "boolean",
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

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new RegisterTaskDefinitionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Register Task Definition Result",
      description: "Result from RegisterTaskDefinition operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          taskDefinition: {
            type: "object",
            properties: {
              taskDefinitionArn: {
                type: "string",
              },
              containerDefinitions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    image: {
                      type: "string",
                    },
                    repositoryCredentials: {
                      type: "object",
                      properties: {
                        credentialsParameter: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["credentialsParameter"],
                      additionalProperties: false,
                    },
                    cpu: {
                      type: "number",
                    },
                    memory: {
                      type: "number",
                    },
                    memoryReservation: {
                      type: "number",
                    },
                    links: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    portMappings: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    essential: {
                      type: "boolean",
                    },
                    restartPolicy: {
                      type: "object",
                      properties: {
                        enabled: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ignoredExitCodes: {
                          type: "object",
                          additionalProperties: true,
                        },
                        restartAttemptPeriod: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["enabled"],
                      additionalProperties: false,
                    },
                    entryPoint: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    command: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    environment: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    environmentFiles: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    mountPoints: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    volumesFrom: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    linuxParameters: {
                      type: "object",
                      properties: {
                        capabilities: {
                          type: "object",
                          additionalProperties: true,
                        },
                        devices: {
                          type: "object",
                          additionalProperties: true,
                        },
                        initProcessEnabled: {
                          type: "object",
                          additionalProperties: true,
                        },
                        sharedMemorySize: {
                          type: "object",
                          additionalProperties: true,
                        },
                        tmpfs: {
                          type: "object",
                          additionalProperties: true,
                        },
                        maxSwap: {
                          type: "object",
                          additionalProperties: true,
                        },
                        swappiness: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    secrets: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    dependsOn: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    startTimeout: {
                      type: "number",
                    },
                    stopTimeout: {
                      type: "number",
                    },
                    versionConsistency: {
                      type: "string",
                    },
                    hostname: {
                      type: "string",
                    },
                    user: {
                      type: "string",
                    },
                    workingDirectory: {
                      type: "string",
                    },
                    disableNetworking: {
                      type: "boolean",
                    },
                    privileged: {
                      type: "boolean",
                    },
                    readonlyRootFilesystem: {
                      type: "boolean",
                    },
                    dnsServers: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    dnsSearchDomains: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    extraHosts: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    dockerSecurityOptions: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    interactive: {
                      type: "boolean",
                    },
                    pseudoTerminal: {
                      type: "boolean",
                    },
                    dockerLabels: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                    ulimits: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    logConfiguration: {
                      type: "object",
                      properties: {
                        logDriver: {
                          type: "object",
                          additionalProperties: true,
                        },
                        options: {
                          type: "object",
                          additionalProperties: true,
                        },
                        secretOptions: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["logDriver"],
                      additionalProperties: false,
                    },
                    healthCheck: {
                      type: "object",
                      properties: {
                        command: {
                          type: "object",
                          additionalProperties: true,
                        },
                        interval: {
                          type: "object",
                          additionalProperties: true,
                        },
                        timeout: {
                          type: "object",
                          additionalProperties: true,
                        },
                        retries: {
                          type: "object",
                          additionalProperties: true,
                        },
                        startPeriod: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["command"],
                      additionalProperties: false,
                    },
                    systemControls: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    resourceRequirements: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    firelensConfiguration: {
                      type: "object",
                      properties: {
                        type: {
                          type: "object",
                          additionalProperties: true,
                        },
                        options: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["type"],
                      additionalProperties: false,
                    },
                    credentialSpecs: {
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
              family: {
                type: "string",
              },
              taskRoleArn: {
                type: "string",
              },
              executionRoleArn: {
                type: "string",
              },
              networkMode: {
                type: "string",
              },
              revision: {
                type: "number",
              },
              volumes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    host: {
                      type: "object",
                      properties: {
                        sourcePath: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    dockerVolumeConfiguration: {
                      type: "object",
                      properties: {
                        scope: {
                          type: "object",
                          additionalProperties: true,
                        },
                        autoprovision: {
                          type: "object",
                          additionalProperties: true,
                        },
                        driver: {
                          type: "object",
                          additionalProperties: true,
                        },
                        driverOpts: {
                          type: "object",
                          additionalProperties: true,
                        },
                        labels: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    efsVolumeConfiguration: {
                      type: "object",
                      properties: {
                        fileSystemId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        rootDirectory: {
                          type: "object",
                          additionalProperties: true,
                        },
                        transitEncryption: {
                          type: "object",
                          additionalProperties: true,
                        },
                        transitEncryptionPort: {
                          type: "object",
                          additionalProperties: true,
                        },
                        authorizationConfig: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["fileSystemId"],
                      additionalProperties: false,
                    },
                    fsxWindowsFileServerVolumeConfiguration: {
                      type: "object",
                      properties: {
                        fileSystemId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        rootDirectory: {
                          type: "object",
                          additionalProperties: true,
                        },
                        authorizationConfig: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: [
                        "fileSystemId",
                        "rootDirectory",
                        "authorizationConfig",
                      ],
                      additionalProperties: false,
                    },
                    configuredAtLaunch: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
              },
              status: {
                type: "string",
              },
              requiresAttributes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    value: {
                      type: "string",
                    },
                    targetType: {
                      type: "string",
                    },
                    targetId: {
                      type: "string",
                    },
                  },
                  required: ["name"],
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
              compatibilities: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              runtimePlatform: {
                type: "object",
                properties: {
                  cpuArchitecture: {
                    type: "string",
                  },
                  operatingSystemFamily: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              requiresCompatibilities: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              cpu: {
                type: "string",
              },
              memory: {
                type: "string",
              },
              inferenceAccelerators: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    deviceName: {
                      type: "string",
                    },
                    deviceType: {
                      type: "string",
                    },
                  },
                  required: ["deviceName", "deviceType"],
                  additionalProperties: false,
                },
              },
              pidMode: {
                type: "string",
              },
              ipcMode: {
                type: "string",
              },
              proxyConfiguration: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                  },
                  containerName: {
                    type: "string",
                  },
                  properties: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: {
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
                },
                required: ["containerName"],
                additionalProperties: false,
              },
              registeredAt: {
                type: "string",
              },
              deregisteredAt: {
                type: "string",
              },
              registeredBy: {
                type: "string",
              },
              ephemeralStorage: {
                type: "object",
                properties: {
                  sizeInGiB: {
                    type: "number",
                  },
                },
                required: ["sizeInGiB"],
                additionalProperties: false,
              },
              enableFaultInjection: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description:
              "The full description of the registered task definition.",
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
            description:
              "The list of tags associated with the task definition.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default registerTaskDefinition;

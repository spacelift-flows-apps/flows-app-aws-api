import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECSClient,
  DeregisterTaskDefinitionCommand,
} from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deregisterTaskDefinition: AppBlock = {
  name: "Deregister Task Definition",
  description: `Deregisters the specified task definition by family and revision.`,
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
        taskDefinition: {
          name: "task Definition",
          description:
            "The family and revision (family:revision) or full Amazon Resource Name (ARN) of the task definition to deregister.",
          type: "string",
          required: true,
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

        const command = new DeregisterTaskDefinitionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Deregister Task Definition Result",
      description: "Result from DeregisterTaskDefinition operation",
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
            description: "The full description of the deregistered task.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deregisterTaskDefinition;

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
                          containerPort: {},
                          hostPort: {},
                          protocol: {},
                          name: {},
                          appProtocol: {},
                          containerPortRange: {},
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
                          items: {},
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
                          name: {},
                          value: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    environmentFiles: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          value: {},
                          type: {},
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
                          sourceVolume: {},
                          containerPath: {},
                          readOnly: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    volumesFrom: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          sourceContainer: {},
                          readOnly: {},
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
                            add: {},
                            drop: {},
                          },
                          additionalProperties: false,
                        },
                        devices: {
                          type: "array",
                          items: {},
                        },
                        initProcessEnabled: {
                          type: "boolean",
                        },
                        sharedMemorySize: {
                          type: "number",
                        },
                        tmpfs: {
                          type: "array",
                          items: {},
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
                          name: {},
                          valueFrom: {},
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
                          containerName: {},
                          condition: {},
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
                      enum: ["enabled", "disabled"],
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
                          hostname: {},
                          ipAddress: {},
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
                          name: {},
                          softLimit: {},
                          hardLimit: {},
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
                          enum: [
                            "json-file",
                            "syslog",
                            "journald",
                            "gelf",
                            "fluentd",
                            "awslogs",
                            "splunk",
                            "awsfirelens",
                          ],
                        },
                        options: {
                          type: "object",
                          additionalProperties: {
                            type: "object",
                          },
                        },
                        secretOptions: {
                          type: "array",
                          items: {},
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
                          items: {},
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
                          namespace: {},
                          value: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    resourceRequirements: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          value: {},
                          type: {},
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
                          enum: ["fluentd", "fluentbit"],
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
                enum: ["bridge", "host", "awsvpc", "none"],
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
                          enum: ["task", "shared"],
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
                          enum: ["ENABLED", "DISABLED"],
                        },
                        transitEncryptionPort: {
                          type: "number",
                        },
                        authorizationConfig: {
                          type: "object",
                          properties: {
                            accessPointId: {},
                            iam: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      required: ["fileSystemId"],
                      additionalProperties: false,
                    },
                    s3filesVolumeConfiguration: {
                      type: "object",
                      properties: {
                        fileSystemArn: {
                          type: "string",
                        },
                        rootDirectory: {
                          type: "string",
                        },
                        transitEncryptionPort: {
                          type: "number",
                        },
                        accessPointArn: {
                          type: "string",
                        },
                      },
                      required: ["fileSystemArn"],
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
                            credentialsParameter: {},
                            domain: {},
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
              status: {
                type: "string",
                enum: ["ACTIVE", "INACTIVE", "DELETE_IN_PROGRESS"],
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
                      enum: ["container-instance"],
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
                      enum: ["memberOf"],
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
                  enum: ["EC2", "FARGATE", "EXTERNAL", "MANAGED_INSTANCES"],
                },
              },
              runtimePlatform: {
                type: "object",
                properties: {
                  cpuArchitecture: {
                    type: "string",
                    enum: ["X86_64", "ARM64"],
                  },
                  operatingSystemFamily: {
                    type: "string",
                    enum: [
                      "WINDOWS_SERVER_2019_FULL",
                      "WINDOWS_SERVER_2019_CORE",
                      "WINDOWS_SERVER_2016_FULL",
                      "WINDOWS_SERVER_2004_CORE",
                      "WINDOWS_SERVER_2022_CORE",
                      "WINDOWS_SERVER_2022_FULL",
                      "WINDOWS_SERVER_2025_CORE",
                      "WINDOWS_SERVER_2025_FULL",
                      "WINDOWS_SERVER_20H2_CORE",
                      "LINUX",
                    ],
                  },
                },
                additionalProperties: false,
              },
              requiresCompatibilities: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["EC2", "FARGATE", "EXTERNAL", "MANAGED_INSTANCES"],
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
                enum: ["host", "task"],
              },
              ipcMode: {
                type: "string",
                enum: ["host", "task", "none"],
              },
              proxyConfiguration: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["APPMESH"],
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
              registeredAt: {
                type: "string",
              },
              deregisteredAt: {
                type: "string",
              },
              deleteRequestedAt: {
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

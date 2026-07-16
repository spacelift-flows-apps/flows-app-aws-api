import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECSClient,
  RegisterDaemonTaskDefinitionCommand,
} from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const registerDaemonTaskDefinition: AppBlock = {
  name: "Register Daemon Task Definition",
  description: `Registers a new daemon task definition from the supplied family and containerDefinitions.`,
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
          description:
            "You must specify a family for a daemon task definition.",
          type: "string",
          required: true,
        },
        taskRoleArn: {
          name: "task Role Arn",
          description:
            "The short name or full Amazon Resource Name (ARN) of the IAM role that containers in this daemon task can assume.",
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
        containerDefinitions: {
          name: "container Definitions",
          description:
            "A list of container definitions in JSON format that describe the containers that make up your daemon task.",
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
                memory: {
                  type: "number",
                },
                memoryReservation: {
                  type: "number",
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
                healthCheck: {
                  type: "object",
                  properties: {
                    command: {
                      type: "array",
                      items: {
                        type: "string",
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
                cpu: {
                  type: "number",
                },
                essential: {
                  type: "boolean",
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
                workingDirectory: {
                  type: "string",
                },
                environmentFiles: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      value: {
                        type: "string",
                      },
                      type: {
                        type: "string",
                      },
                    },
                    required: ["value", "type"],
                    additionalProperties: false,
                  },
                },
                environment: {
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
                secrets: {
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
                readonlyRootFilesystem: {
                  type: "boolean",
                },
                mountPoints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      sourceVolume: {
                        type: "string",
                      },
                      containerPath: {
                        type: "string",
                      },
                      readOnly: {
                        type: "boolean",
                      },
                    },
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
                          name: {},
                          valueFrom: {},
                        },
                        required: ["name", "valueFrom"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["logDriver"],
                  additionalProperties: false,
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
                        type: "string",
                      },
                    },
                  },
                  required: ["type"],
                  additionalProperties: false,
                },
                privileged: {
                  type: "boolean",
                },
                user: {
                  type: "string",
                },
                ulimits: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                      },
                      softLimit: {
                        type: "number",
                      },
                      hardLimit: {
                        type: "number",
                      },
                    },
                    required: ["name", "softLimit", "hardLimit"],
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
                          type: "array",
                          items: {},
                        },
                        drop: {
                          type: "array",
                          items: {},
                        },
                      },
                      additionalProperties: false,
                    },
                    devices: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          hostPath: {},
                          containerPath: {},
                          permissions: {},
                        },
                        required: ["hostPath"],
                        additionalProperties: false,
                      },
                    },
                    initProcessEnabled: {
                      type: "boolean",
                    },
                    tmpfs: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          containerPath: {},
                          size: {},
                          mountOptions: {},
                        },
                        required: ["containerPath", "size"],
                        additionalProperties: false,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                dependsOn: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      containerName: {
                        type: "string",
                      },
                      condition: {
                        type: "string",
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
                systemControls: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      namespace: {
                        type: "string",
                      },
                      value: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                interactive: {
                  type: "boolean",
                },
                pseudoTerminal: {
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
                        type: "number",
                      },
                    },
                    restartAttemptPeriod: {
                      type: "number",
                    },
                  },
                  required: ["enabled"],
                  additionalProperties: false,
                },
              },
              required: ["image"],
              additionalProperties: false,
            },
          },
          required: true,
        },
        cpu: {
          name: "cpu",
          description: "The number of CPU units used by the daemon task.",
          type: "string",
          required: false,
        },
        memory: {
          name: "memory",
          description: "The amount of memory (in MiB) used by the daemon task.",
          type: "string",
          required: false,
        },
        volumes: {
          name: "volumes",
          description:
            "A list of volume definitions in JSON format that containers in your daemon task can use.",
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
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        tags: {
          name: "tags",
          description:
            "The metadata that you apply to the daemon task definition to help you categorize and organize them.",
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

        const command = new RegisterDaemonTaskDefinitionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Register Daemon Task Definition Result",
      description: "Result from RegisterDaemonTaskDefinition operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          daemonTaskDefinitionArn: {
            type: "string",
            description:
              "The full Amazon Resource Name (ARN) of the registered daemon task definition.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default registerDaemonTaskDefinition;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECSClient,
  DescribeDaemonTaskDefinitionCommand,
} from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDaemonTaskDefinition: AppBlock = {
  name: "Describe Daemon Task Definition",
  description: `Describes a daemon task definition.`,
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
        daemonTaskDefinition: {
          name: "daemon Task Definition",
          description:
            "The family for the latest ACTIVE revision, family and revision (family:revision) for a specific revision in the family, or full Amazon Resource Name (ARN) of the daemon task definition to describe.",
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

        const command = new DescribeDaemonTaskDefinitionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Daemon Task Definition Result",
      description: "Result from DescribeDaemonTaskDefinition operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          daemonTaskDefinition: {
            type: "object",
            properties: {
              daemonTaskDefinitionArn: {
                type: "string",
              },
              family: {
                type: "string",
              },
              revision: {
                type: "number",
              },
              taskRoleArn: {
                type: "string",
              },
              executionRoleArn: {
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
                          value: {},
                          type: {},
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
                          name: {},
                          value: {},
                        },
                        additionalProperties: false,
                      },
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
                    readonlyRootFilesystem: {
                      type: "boolean",
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
                          name: {},
                          softLimit: {},
                          hardLimit: {},
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
                        tmpfs: {
                          type: "array",
                          items: {},
                        },
                      },
                      additionalProperties: false,
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
                          items: {},
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
                  },
                  additionalProperties: false,
                },
              },
              cpu: {
                type: "string",
              },
              memory: {
                type: "string",
              },
              status: {
                type: "string",
                enum: ["ACTIVE", "DELETE_IN_PROGRESS", "DELETED"],
              },
              registeredAt: {
                type: "string",
              },
              deleteRequestedAt: {
                type: "string",
              },
              registeredBy: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The full daemon task definition description.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDaemonTaskDefinition;

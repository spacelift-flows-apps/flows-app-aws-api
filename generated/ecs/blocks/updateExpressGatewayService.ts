import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECSClient,
  UpdateExpressGatewayServiceCommand,
} from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateExpressGatewayService: AppBlock = {
  name: "Update Express Gateway Service",
  description: `Updates an existing Express service configuration.`,
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
        serviceArn: {
          name: "service Arn",
          description:
            "The Amazon Resource Name (ARN) of the Express service to update.",
          type: "string",
          required: true,
        },
        executionRoleArn: {
          name: "execution Role Arn",
          description:
            "The Amazon Resource Name (ARN) of the task execution role for the Express service.",
          type: "string",
          required: false,
        },
        healthCheckPath: {
          name: "health Check Path",
          description:
            "The path on the container for Application Load Balancer health checks.",
          type: "string",
          required: false,
        },
        primaryContainer: {
          name: "primary Container",
          description:
            "The primary container configuration for the Express service.",
          type: {
            type: "object",
            properties: {
              image: {
                type: "string",
              },
              containerPort: {
                type: "number",
              },
              awsLogsConfiguration: {
                type: "object",
                properties: {
                  logGroup: {
                    type: "string",
                  },
                  logStreamPrefix: {
                    type: "string",
                  },
                },
                required: ["logGroup", "logStreamPrefix"],
                additionalProperties: false,
              },
              repositoryCredentials: {
                type: "object",
                properties: {
                  credentialsParameter: {
                    type: "string",
                  },
                },
                additionalProperties: false,
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
            },
            required: ["image"],
            additionalProperties: false,
          },
          required: false,
        },
        taskRoleArn: {
          name: "task Role Arn",
          description:
            "The Amazon Resource Name (ARN) of the IAM role for containers in this task.",
          type: "string",
          required: false,
        },
        networkConfiguration: {
          name: "network Configuration",
          description:
            "The network configuration for the Express service tasks.",
          type: {
            type: "object",
            properties: {
              securityGroups: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              subnets: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
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
        scalingTarget: {
          name: "scaling Target",
          description:
            "The auto-scaling configuration for the Express service.",
          type: {
            type: "object",
            properties: {
              minTaskCount: {
                type: "number",
              },
              maxTaskCount: {
                type: "number",
              },
              autoScalingMetric: {
                type: "string",
              },
              autoScalingTargetValue: {
                type: "number",
              },
            },
            additionalProperties: false,
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

        const command = new UpdateExpressGatewayServiceCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Express Gateway Service Result",
      description: "Result from UpdateExpressGatewayService operation",
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
              cluster: {
                type: "string",
              },
              serviceName: {
                type: "string",
              },
              status: {
                type: "object",
                properties: {
                  statusCode: {
                    type: "string",
                  },
                  statusReason: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              targetConfiguration: {
                type: "object",
                properties: {
                  serviceRevisionArn: {
                    type: "string",
                  },
                  executionRoleArn: {
                    type: "string",
                  },
                  taskRoleArn: {
                    type: "string",
                  },
                  cpu: {
                    type: "string",
                  },
                  memory: {
                    type: "string",
                  },
                  networkConfiguration: {
                    type: "object",
                    properties: {
                      securityGroups: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                      subnets: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                  healthCheckPath: {
                    type: "string",
                  },
                  primaryContainer: {
                    type: "object",
                    properties: {
                      image: {
                        type: "string",
                      },
                      containerPort: {
                        type: "number",
                      },
                      awsLogsConfiguration: {
                        type: "object",
                        properties: {
                          logGroup: {
                            type: "string",
                          },
                          logStreamPrefix: {
                            type: "string",
                          },
                        },
                        required: ["logGroup", "logStreamPrefix"],
                        additionalProperties: false,
                      },
                      repositoryCredentials: {
                        type: "object",
                        properties: {
                          credentialsParameter: {
                            type: "string",
                          },
                        },
                        additionalProperties: false,
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
                    },
                    required: ["image"],
                    additionalProperties: false,
                  },
                  scalingTarget: {
                    type: "object",
                    properties: {
                      minTaskCount: {
                        type: "number",
                      },
                      maxTaskCount: {
                        type: "number",
                      },
                      autoScalingMetric: {
                        type: "string",
                      },
                      autoScalingTargetValue: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  ingressPaths: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        accessType: {
                          type: "string",
                        },
                        endpoint: {
                          type: "string",
                        },
                      },
                      required: ["accessType", "endpoint"],
                      additionalProperties: false,
                    },
                  },
                  createdAt: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              createdAt: {
                type: "string",
              },
              updatedAt: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The full description of your express gateway service following the update call.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateExpressGatewayService;

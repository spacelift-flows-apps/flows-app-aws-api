import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECSClient,
  DeleteExpressGatewayServiceCommand,
} from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteExpressGatewayService: AppBlock = {
  name: "Delete Express Gateway Service",
  description: `Deletes an Express service and removes all associated Amazon Web Services resources.`,
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
            "The Amazon Resource Name (ARN) of the Express service to delete.",
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

        const command = new DeleteExpressGatewayServiceCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Express Gateway Service Result",
      description: "Result from DeleteExpressGatewayService operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          service: {
            type: "object",
            properties: {
              cluster: {
                type: "string",
              },
              serviceName: {
                type: "string",
              },
              serviceArn: {
                type: "string",
              },
              infrastructureRoleArn: {
                type: "string",
              },
              status: {
                type: "object",
                properties: {
                  statusCode: {
                    type: "string",
                    enum: ["ACTIVE", "DRAINING", "INACTIVE"],
                  },
                  statusReason: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              currentDeployment: {
                type: "string",
              },
              activeConfigurations: {
                type: "array",
                items: {
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
                          items: {},
                        },
                        subnets: {
                          type: "array",
                          items: {},
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
                            logGroup: {},
                            logStreamPrefix: {},
                          },
                          required: ["logGroup", "logStreamPrefix"],
                          additionalProperties: false,
                        },
                        repositoryCredentials: {
                          type: "object",
                          properties: {
                            credentialsParameter: {},
                          },
                          additionalProperties: false,
                        },
                        command: {
                          type: "array",
                          items: {},
                        },
                        environment: {
                          type: "array",
                          items: {},
                        },
                        secrets: {
                          type: "array",
                          items: {},
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
                          enum: [
                            "AVERAGE_CPU",
                            "AVERAGE_MEMORY",
                            "REQUEST_COUNT_PER_TARGET",
                          ],
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
                          accessType: {},
                          endpoint: {},
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
              createdAt: {
                type: "string",
              },
              updatedAt: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The full description of the deleted express service.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteExpressGatewayService;

import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, DeleteTaskSetCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteTaskSet: AppBlock = {
  name: "Delete Task Set",
  description: `Deletes a specified task set within a service.`,
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
            "The short name or full Amazon Resource Name (ARN) of the cluster that hosts the service that the task set found in to delete.",
          type: "string",
          required: true,
        },
        service: {
          name: "service",
          description:
            "The short name or full Amazon Resource Name (ARN) of the service that hosts the task set to delete.",
          type: "string",
          required: true,
        },
        taskSet: {
          name: "task Set",
          description:
            "The task set ID or full Amazon Resource Name (ARN) of the task set to delete.",
          type: "string",
          required: true,
        },
        force: {
          name: "force",
          description:
            "If true, you can delete a task set even if it hasn't been scaled down to zero.",
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

        const command = new DeleteTaskSetCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Task Set Result",
      description: "Result from DeleteTaskSet operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          taskSet: {
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
            description: "Details about the task set.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteTaskSet;

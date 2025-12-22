import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, CreateTaskSetCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createTaskSet: AppBlock = {
  name: "Create Task Set",
  description: `Create a task set in the specified cluster and service.`,
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
        service: {
          name: "service",
          description:
            "The short name or full Amazon Resource Name (ARN) of the service to create the task set in.",
          type: "string",
          required: true,
        },
        cluster: {
          name: "cluster",
          description:
            "The short name or full Amazon Resource Name (ARN) of the cluster that hosts the service to create the task set in.",
          type: "string",
          required: true,
        },
        externalId: {
          name: "external Id",
          description:
            "An optional non-unique tag that identifies this task set in external systems.",
          type: "string",
          required: false,
        },
        taskDefinition: {
          name: "task Definition",
          description:
            "The task definition for the tasks in the task set to use.",
          type: "string",
          required: true,
        },
        networkConfiguration: {
          name: "network Configuration",
          description:
            "An object representing the network configuration for a task set.",
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
        loadBalancers: {
          name: "load Balancers",
          description:
            "A load balancer object representing the load balancer to use with the task set.",
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
            "The details of the service discovery registries to assign to this task set.",
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
        launchType: {
          name: "launch Type",
          description: "The launch type that new tasks in the task set uses.",
          type: "string",
          required: false,
        },
        capacityProviderStrategy: {
          name: "capacity Provider Strategy",
          description:
            "The capacity provider strategy to use for the task set.",
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
            "The platform version that the tasks in the task set uses.",
          type: "string",
          required: false,
        },
        scale: {
          name: "scale",
          description:
            "A floating-point percentage of the desired number of tasks to place and keep running in the task set.",
          type: {
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
          required: false,
        },
        clientToken: {
          name: "client Token",
          description:
            "An identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        tags: {
          name: "tags",
          description:
            "The metadata that you apply to the task set to help you categorize and organize them.",
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

        const command = new CreateTaskSetCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Task Set Result",
      description: "Result from CreateTaskSet operation",
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
            description:
              "Information about a set of Amazon ECS tasks in either an CodeDeploy or an EXTERNAL deployment.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createTaskSet;

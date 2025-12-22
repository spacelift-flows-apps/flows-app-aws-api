import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, DescribeTasksCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeTasks: AppBlock = {
  name: "Describe Tasks",
  description: `Describes a specified task or tasks.`,
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
            "The short name or full Amazon Resource Name (ARN) of the cluster that hosts the task or tasks to describe.",
          type: "string",
          required: false,
        },
        tasks: {
          name: "tasks",
          description: "A list of up to 100 task IDs or full ARN entries.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        include: {
          name: "include",
          description:
            "Specifies whether you want to see the resource tags for the task.",
          type: {
            type: "array",
            items: {
              type: "string",
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

        const command = new DescribeTasksCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Tasks Result",
      description: "Result from DescribeTasks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                attachments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "object",
                        additionalProperties: true,
                      },
                      type: {
                        type: "object",
                        additionalProperties: true,
                      },
                      status: {
                        type: "object",
                        additionalProperties: true,
                      },
                      details: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                attributes: {
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
                      targetType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      targetId: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["name"],
                    additionalProperties: false,
                  },
                },
                availabilityZone: {
                  type: "string",
                },
                capacityProviderName: {
                  type: "string",
                },
                clusterArn: {
                  type: "string",
                },
                connectivity: {
                  type: "string",
                },
                connectivityAt: {
                  type: "string",
                },
                containerInstanceArn: {
                  type: "string",
                },
                containers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      containerArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      taskArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      image: {
                        type: "object",
                        additionalProperties: true,
                      },
                      imageDigest: {
                        type: "object",
                        additionalProperties: true,
                      },
                      runtimeId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      lastStatus: {
                        type: "object",
                        additionalProperties: true,
                      },
                      exitCode: {
                        type: "object",
                        additionalProperties: true,
                      },
                      reason: {
                        type: "object",
                        additionalProperties: true,
                      },
                      networkBindings: {
                        type: "object",
                        additionalProperties: true,
                      },
                      networkInterfaces: {
                        type: "object",
                        additionalProperties: true,
                      },
                      healthStatus: {
                        type: "object",
                        additionalProperties: true,
                      },
                      managedAgents: {
                        type: "object",
                        additionalProperties: true,
                      },
                      cpu: {
                        type: "object",
                        additionalProperties: true,
                      },
                      memory: {
                        type: "object",
                        additionalProperties: true,
                      },
                      memoryReservation: {
                        type: "object",
                        additionalProperties: true,
                      },
                      gpuIds: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                cpu: {
                  type: "string",
                },
                createdAt: {
                  type: "string",
                },
                desiredStatus: {
                  type: "string",
                },
                enableExecuteCommand: {
                  type: "boolean",
                },
                executionStoppedAt: {
                  type: "string",
                },
                group: {
                  type: "string",
                },
                healthStatus: {
                  type: "string",
                },
                inferenceAccelerators: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      deviceName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      deviceType: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["deviceName", "deviceType"],
                    additionalProperties: false,
                  },
                },
                lastStatus: {
                  type: "string",
                },
                launchType: {
                  type: "string",
                },
                memory: {
                  type: "string",
                },
                overrides: {
                  type: "object",
                  properties: {
                    containerOverrides: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    cpu: {
                      type: "string",
                    },
                    inferenceAcceleratorOverrides: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    executionRoleArn: {
                      type: "string",
                    },
                    memory: {
                      type: "string",
                    },
                    taskRoleArn: {
                      type: "string",
                    },
                    ephemeralStorage: {
                      type: "object",
                      properties: {
                        sizeInGiB: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["sizeInGiB"],
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                platformVersion: {
                  type: "string",
                },
                platformFamily: {
                  type: "string",
                },
                pullStartedAt: {
                  type: "string",
                },
                pullStoppedAt: {
                  type: "string",
                },
                startedAt: {
                  type: "string",
                },
                startedBy: {
                  type: "string",
                },
                stopCode: {
                  type: "string",
                },
                stoppedAt: {
                  type: "string",
                },
                stoppedReason: {
                  type: "string",
                },
                stoppingAt: {
                  type: "string",
                },
                tags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      key: {
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
                taskArn: {
                  type: "string",
                },
                taskDefinitionArn: {
                  type: "string",
                },
                version: {
                  type: "number",
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
                fargateEphemeralStorage: {
                  type: "object",
                  properties: {
                    sizeInGiB: {
                      type: "number",
                    },
                    kmsKeyId: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "The list of tasks.",
          },
          failures: {
            type: "array",
            items: {
              type: "object",
              properties: {
                arn: {
                  type: "string",
                },
                reason: {
                  type: "string",
                },
                detail: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Any failures associated with the call.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeTasks;

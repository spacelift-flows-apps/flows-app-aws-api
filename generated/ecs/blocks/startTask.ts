import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, StartTaskCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startTask: AppBlock = {
  name: "Start Task",
  description: `Starts a new task from the specified task definition on the specified container instance or instances.`,
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
            "The short name or full Amazon Resource Name (ARN) of the cluster where to start your task.",
          type: "string",
          required: false,
        },
        containerInstances: {
          name: "container Instances",
          description:
            "The container instance IDs or full ARN entries for the container instances where you would like to place your task.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        enableECSManagedTags: {
          name: "enable ECS Managed Tags",
          description:
            "Specifies whether to use Amazon ECS managed tags for the task.",
          type: "boolean",
          required: false,
        },
        enableExecuteCommand: {
          name: "enable Execute Command",
          description:
            "Whether or not the execute command functionality is turned on for the task.",
          type: "boolean",
          required: false,
        },
        group: {
          name: "group",
          description: "The name of the task group to associate with the task.",
          type: "string",
          required: false,
        },
        networkConfiguration: {
          name: "network Configuration",
          description:
            "The VPC subnet and security group configuration for tasks that receive their own elastic network interface by using the awsvpc networking mode.",
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
        overrides: {
          name: "overrides",
          description:
            "A list of container overrides in JSON format that specify the name of a container in the specified task definition and the overrides it receives.",
          type: {
            type: "object",
            properties: {
              containerOverrides: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
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
                    cpu: {
                      type: "number",
                    },
                    memory: {
                      type: "number",
                    },
                    memoryReservation: {
                      type: "number",
                    },
                    resourceRequirements: {
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
              cpu: {
                type: "string",
              },
              inferenceAcceleratorOverrides: {
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
                  additionalProperties: false,
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
                    type: "number",
                  },
                },
                required: ["sizeInGiB"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        propagateTags: {
          name: "propagate Tags",
          description:
            "Specifies whether to propagate the tags from the task definition or the service to the task.",
          type: "string",
          required: false,
        },
        referenceId: {
          name: "reference Id",
          description: "This parameter is only used by Amazon ECS.",
          type: "string",
          required: false,
        },
        startedBy: {
          name: "started By",
          description: "An optional tag specified when a task is started.",
          type: "string",
          required: false,
        },
        tags: {
          name: "tags",
          description:
            "The metadata that you apply to the task to help you categorize and organize them.",
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
        taskDefinition: {
          name: "task Definition",
          description:
            "The family and revision (family:revision) or full ARN of the task definition to start.",
          type: "string",
          required: true,
        },
        volumeConfigurations: {
          name: "volume Configurations",
          description: "The details of the volume that was configuredAtLaunch.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                managedEBSVolume: {
                  type: "object",
                  properties: {
                    encrypted: {
                      type: "boolean",
                    },
                    kmsKeyId: {
                      type: "string",
                    },
                    volumeType: {
                      type: "string",
                    },
                    sizeInGiB: {
                      type: "number",
                    },
                    snapshotId: {
                      type: "string",
                    },
                    volumeInitializationRate: {
                      type: "number",
                    },
                    iops: {
                      type: "number",
                    },
                    throughput: {
                      type: "number",
                    },
                    tagSpecifications: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    roleArn: {
                      type: "string",
                    },
                    terminationPolicy: {
                      type: "object",
                      properties: {
                        deleteOnTermination: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["deleteOnTermination"],
                      additionalProperties: false,
                    },
                    filesystemType: {
                      type: "string",
                    },
                  },
                  required: ["roleArn"],
                  additionalProperties: false,
                },
              },
              required: ["name"],
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
        }

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new StartTaskCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Task Result",
      description: "Result from StartTask operation",
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
            description: "A full description of the tasks that were started.",
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

export default startTask;

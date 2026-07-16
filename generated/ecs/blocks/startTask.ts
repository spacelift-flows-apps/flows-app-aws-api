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
                    enum: ["ENABLED", "DISABLED"],
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
                        properties: {
                          value: {},
                          type: {},
                        },
                        required: ["value", "type"],
                        additionalProperties: false,
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
          type: {
            type: "string",
            enum: ["TASK_DEFINITION", "SERVICE", "NONE"],
          },
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
                        properties: {
                          resourceType: {},
                          tags: {},
                          propagateTags: {},
                        },
                        required: ["resourceType"],
                        additionalProperties: false,
                      },
                    },
                    roleArn: {
                      type: "string",
                    },
                    terminationPolicy: {
                      type: "object",
                      properties: {
                        deleteOnTermination: {
                          type: "boolean",
                        },
                      },
                      required: ["deleteOnTermination"],
                      additionalProperties: false,
                    },
                    filesystemType: {
                      type: "string",
                      enum: ["ext3", "ext4", "xfs", "ntfs"],
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
                        type: "string",
                      },
                      type: {
                        type: "string",
                      },
                      status: {
                        type: "string",
                      },
                      details: {
                        type: "array",
                        items: {},
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
                  enum: ["CONNECTED", "DISCONNECTED"],
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
                        type: "string",
                      },
                      taskArn: {
                        type: "string",
                      },
                      name: {
                        type: "string",
                      },
                      image: {
                        type: "string",
                      },
                      imageDigest: {
                        type: "string",
                      },
                      runtimeId: {
                        type: "string",
                      },
                      lastStatus: {
                        type: "string",
                      },
                      exitCode: {
                        type: "number",
                      },
                      reason: {
                        type: "string",
                      },
                      networkBindings: {
                        type: "array",
                        items: {},
                      },
                      networkInterfaces: {
                        type: "array",
                        items: {},
                      },
                      healthStatus: {
                        type: "string",
                        enum: ["HEALTHY", "UNHEALTHY", "UNKNOWN"],
                      },
                      managedAgents: {
                        type: "array",
                        items: {},
                      },
                      cpu: {
                        type: "string",
                      },
                      memory: {
                        type: "string",
                      },
                      memoryReservation: {
                        type: "string",
                      },
                      gpuIds: {
                        type: "array",
                        items: {},
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
                  enum: ["HEALTHY", "UNHEALTHY", "UNKNOWN"],
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
                lastStatus: {
                  type: "string",
                },
                launchType: {
                  type: "string",
                  enum: ["EC2", "FARGATE", "EXTERNAL", "MANAGED_INSTANCES"],
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
                        properties: {
                          name: {},
                          command: {},
                          environment: {},
                          environmentFiles: {},
                          cpu: {},
                          memory: {},
                          memoryReservation: {},
                          resourceRequirements: {},
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
                          deviceName: {},
                          deviceType: {},
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
                  enum: [
                    "TaskFailedToStart",
                    "EssentialContainerExited",
                    "UserInitiated",
                    "ServiceSchedulerInitiated",
                    "SpotInterruption",
                    "TerminationNotice",
                  ],
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
                        type: "string",
                      },
                      value: {
                        type: "string",
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

import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, DeleteTaskDefinitionsCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteTaskDefinitions: AppBlock = {
  name: "Delete Task Definitions",
  description: `Deletes one or more task definitions.`,
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
        taskDefinitions: {
          name: "task Definitions",
          description:
            "The family and revision (family:revision) or full Amazon Resource Name (ARN) of the task definition to delete.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const command = new DeleteTaskDefinitionsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Task Definitions Result",
      description: "Result from DeleteTaskDefinitions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          taskDefinitions: {
            type: "array",
            items: {
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
                        type: "object",
                        additionalProperties: true,
                      },
                      image: {
                        type: "object",
                        additionalProperties: true,
                      },
                      repositoryCredentials: {
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
                      links: {
                        type: "object",
                        additionalProperties: true,
                      },
                      portMappings: {
                        type: "object",
                        additionalProperties: true,
                      },
                      essential: {
                        type: "object",
                        additionalProperties: true,
                      },
                      restartPolicy: {
                        type: "object",
                        additionalProperties: true,
                      },
                      entryPoint: {
                        type: "object",
                        additionalProperties: true,
                      },
                      command: {
                        type: "object",
                        additionalProperties: true,
                      },
                      environment: {
                        type: "object",
                        additionalProperties: true,
                      },
                      environmentFiles: {
                        type: "object",
                        additionalProperties: true,
                      },
                      mountPoints: {
                        type: "object",
                        additionalProperties: true,
                      },
                      volumesFrom: {
                        type: "object",
                        additionalProperties: true,
                      },
                      linuxParameters: {
                        type: "object",
                        additionalProperties: true,
                      },
                      secrets: {
                        type: "object",
                        additionalProperties: true,
                      },
                      dependsOn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      startTimeout: {
                        type: "object",
                        additionalProperties: true,
                      },
                      stopTimeout: {
                        type: "object",
                        additionalProperties: true,
                      },
                      versionConsistency: {
                        type: "object",
                        additionalProperties: true,
                      },
                      hostname: {
                        type: "object",
                        additionalProperties: true,
                      },
                      user: {
                        type: "object",
                        additionalProperties: true,
                      },
                      workingDirectory: {
                        type: "object",
                        additionalProperties: true,
                      },
                      disableNetworking: {
                        type: "object",
                        additionalProperties: true,
                      },
                      privileged: {
                        type: "object",
                        additionalProperties: true,
                      },
                      readonlyRootFilesystem: {
                        type: "object",
                        additionalProperties: true,
                      },
                      dnsServers: {
                        type: "object",
                        additionalProperties: true,
                      },
                      dnsSearchDomains: {
                        type: "object",
                        additionalProperties: true,
                      },
                      extraHosts: {
                        type: "object",
                        additionalProperties: true,
                      },
                      dockerSecurityOptions: {
                        type: "object",
                        additionalProperties: true,
                      },
                      interactive: {
                        type: "object",
                        additionalProperties: true,
                      },
                      pseudoTerminal: {
                        type: "object",
                        additionalProperties: true,
                      },
                      dockerLabels: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ulimits: {
                        type: "object",
                        additionalProperties: true,
                      },
                      logConfiguration: {
                        type: "object",
                        additionalProperties: true,
                      },
                      healthCheck: {
                        type: "object",
                        additionalProperties: true,
                      },
                      systemControls: {
                        type: "object",
                        additionalProperties: true,
                      },
                      resourceRequirements: {
                        type: "object",
                        additionalProperties: true,
                      },
                      firelensConfiguration: {
                        type: "object",
                        additionalProperties: true,
                      },
                      credentialSpecs: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      host: {
                        type: "object",
                        additionalProperties: true,
                      },
                      dockerVolumeConfiguration: {
                        type: "object",
                        additionalProperties: true,
                      },
                      efsVolumeConfiguration: {
                        type: "object",
                        additionalProperties: true,
                      },
                      fsxWindowsFileServerVolumeConfiguration: {
                        type: "object",
                        additionalProperties: true,
                      },
                      configuredAtLaunch: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                status: {
                  type: "string",
                },
                requiresAttributes: {
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
                placementConstraints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: {
                        type: "object",
                        additionalProperties: true,
                      },
                      expression: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                compatibilities: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                runtimePlatform: {
                  type: "object",
                  properties: {
                    cpuArchitecture: {
                      type: "string",
                    },
                    operatingSystemFamily: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                requiresCompatibilities: {
                  type: "array",
                  items: {
                    type: "string",
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
                pidMode: {
                  type: "string",
                },
                ipcMode: {
                  type: "string",
                },
                proxyConfiguration: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                    },
                    containerName: {
                      type: "string",
                    },
                    properties: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
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
            },
            description: "The list of deleted task definitions.",
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

export default deleteTaskDefinitions;

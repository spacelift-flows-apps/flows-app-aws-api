import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECSClient,
  RegisterContainerInstanceCommand,
} from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const registerContainerInstance: AppBlock = {
  name: "Register Container Instance",
  description: `This action is only used by the Amazon ECS agent, and it is not intended for use outside of the agent.`,
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
            "The short name or full Amazon Resource Name (ARN) of the cluster to register your container instance with.",
          type: "string",
          required: false,
        },
        instanceIdentityDocument: {
          name: "instance Identity Document",
          description:
            "The instance identity document for the EC2 instance to register.",
          type: "string",
          required: false,
        },
        instanceIdentityDocumentSignature: {
          name: "instance Identity Document Signature",
          description:
            "The instance identity document signature for the EC2 instance to register.",
          type: "string",
          required: false,
        },
        totalResources: {
          name: "total Resources",
          description: "The resources available on the instance.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                type: {
                  type: "string",
                },
                doubleValue: {
                  type: "number",
                },
                longValue: {
                  type: "number",
                },
                integerValue: {
                  type: "number",
                },
                stringSetValue: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        versionInfo: {
          name: "version Info",
          description:
            "The version information for the Amazon ECS container agent and Docker daemon that runs on the container instance.",
          type: {
            type: "object",
            properties: {
              agentVersion: {
                type: "string",
              },
              agentHash: {
                type: "string",
              },
              dockerVersion: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        containerInstanceArn: {
          name: "container Instance Arn",
          description:
            "The ARN of the container instance (if it was previously registered).",
          type: "string",
          required: false,
        },
        attributes: {
          name: "attributes",
          description:
            "The container instance attributes that this container instance supports.",
          type: {
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
                },
                targetId: {
                  type: "string",
                },
              },
              required: ["name"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        platformDevices: {
          name: "platform Devices",
          description:
            "The devices that are available on the container instance.",
          type: {
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
              },
              required: ["id", "type"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        tags: {
          name: "tags",
          description:
            "The metadata that you apply to the container instance to help you categorize and organize them.",
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

        const command = new RegisterContainerInstanceCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Register Container Instance Result",
      description: "Result from RegisterContainerInstance operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          containerInstance: {
            type: "object",
            properties: {
              containerInstanceArn: {
                type: "string",
              },
              ec2InstanceId: {
                type: "string",
              },
              capacityProviderName: {
                type: "string",
              },
              version: {
                type: "number",
              },
              versionInfo: {
                type: "object",
                properties: {
                  agentVersion: {
                    type: "string",
                  },
                  agentHash: {
                    type: "string",
                  },
                  dockerVersion: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              remainingResources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    type: {
                      type: "string",
                    },
                    doubleValue: {
                      type: "number",
                    },
                    longValue: {
                      type: "number",
                    },
                    integerValue: {
                      type: "number",
                    },
                    stringSetValue: {
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
              registeredResources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    type: {
                      type: "string",
                    },
                    doubleValue: {
                      type: "number",
                    },
                    longValue: {
                      type: "number",
                    },
                    integerValue: {
                      type: "number",
                    },
                    stringSetValue: {
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
              status: {
                type: "string",
              },
              statusReason: {
                type: "string",
              },
              agentConnected: {
                type: "boolean",
              },
              runningTasksCount: {
                type: "number",
              },
              pendingTasksCount: {
                type: "number",
              },
              agentUpdateStatus: {
                type: "string",
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
                    },
                    targetId: {
                      type: "string",
                    },
                  },
                  required: ["name"],
                  additionalProperties: false,
                },
              },
              registeredAt: {
                type: "string",
              },
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
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
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
              healthStatus: {
                type: "object",
                properties: {
                  overallStatus: {
                    type: "string",
                  },
                  details: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: {
                          type: "object",
                          additionalProperties: true,
                        },
                        status: {
                          type: "object",
                          additionalProperties: true,
                        },
                        lastUpdated: {
                          type: "object",
                          additionalProperties: true,
                        },
                        lastStatusChange: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "The container instance that was registered.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default registerContainerInstance;

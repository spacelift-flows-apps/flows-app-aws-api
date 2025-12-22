import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, SubmitTaskStateChangeCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const submitTaskStateChange: AppBlock = {
  name: "Submit Task State Change",
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
            "The short name or full Amazon Resource Name (ARN) of the cluster that hosts the task.",
          type: "string",
          required: false,
        },
        task: {
          name: "task",
          description:
            "The task ID or full ARN of the task in the state change request.",
          type: "string",
          required: false,
        },
        status: {
          name: "status",
          description: "The status of the state change request.",
          type: "string",
          required: false,
        },
        reason: {
          name: "reason",
          description: "The reason for the state change request.",
          type: "string",
          required: false,
        },
        containers: {
          name: "containers",
          description:
            "Any containers that's associated with the state change request.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                containerName: {
                  type: "string",
                },
                imageDigest: {
                  type: "string",
                },
                runtimeId: {
                  type: "string",
                },
                exitCode: {
                  type: "number",
                },
                networkBindings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      bindIP: {
                        type: "object",
                        additionalProperties: true,
                      },
                      containerPort: {
                        type: "object",
                        additionalProperties: true,
                      },
                      hostPort: {
                        type: "object",
                        additionalProperties: true,
                      },
                      protocol: {
                        type: "object",
                        additionalProperties: true,
                      },
                      containerPortRange: {
                        type: "object",
                        additionalProperties: true,
                      },
                      hostPortRange: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                reason: {
                  type: "string",
                },
                status: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        attachments: {
          name: "attachments",
          description:
            "Any attachments associated with the state change request.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                attachmentArn: {
                  type: "string",
                },
                status: {
                  type: "string",
                },
              },
              required: ["attachmentArn", "status"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        managedAgents: {
          name: "managed Agents",
          description:
            "The details for the managed agent that's associated with the task.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                containerName: {
                  type: "string",
                },
                managedAgentName: {
                  type: "string",
                },
                status: {
                  type: "string",
                },
                reason: {
                  type: "string",
                },
              },
              required: ["containerName", "managedAgentName", "status"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        pullStartedAt: {
          name: "pull Started At",
          description:
            "The Unix timestamp for the time when the container image pull started.",
          type: "string",
          required: false,
        },
        pullStoppedAt: {
          name: "pull Stopped At",
          description:
            "The Unix timestamp for the time when the container image pull completed.",
          type: "string",
          required: false,
        },
        executionStoppedAt: {
          name: "execution Stopped At",
          description:
            "The Unix timestamp for the time when the task execution stopped.",
          type: "string",
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

        const command = new SubmitTaskStateChangeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Submit Task State Change Result",
      description: "Result from SubmitTaskStateChange operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          acknowledgment: {
            type: "string",
            description: "Acknowledgement of the state change.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default submitTaskStateChange;

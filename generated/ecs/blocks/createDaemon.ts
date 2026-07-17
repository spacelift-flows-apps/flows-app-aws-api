import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, CreateDaemonCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createDaemon: AppBlock = {
  name: "Create Daemon",
  description: `Creates a new daemon in the specified cluster and capacity providers.`,
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
        daemonName: {
          name: "daemon Name",
          description: "The name of the daemon.",
          type: "string",
          required: true,
        },
        clusterArn: {
          name: "cluster Arn",
          description:
            "The Amazon Resource Name (ARN) of the cluster to create the daemon in.",
          type: "string",
          required: false,
        },
        daemonTaskDefinitionArn: {
          name: "daemon Task Definition Arn",
          description:
            "The Amazon Resource Name (ARN) of the daemon task definition to use for the daemon.",
          type: "string",
          required: true,
        },
        capacityProviderArns: {
          name: "capacity Provider Arns",
          description:
            "The Amazon Resource Names (ARNs) of the capacity providers to associate with the daemon.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        deploymentConfiguration: {
          name: "deployment Configuration",
          description:
            "Optional deployment parameters that control how the daemon rolls out updates, including the drain percentage, alarm-based rollback, and bake time.",
          type: {
            type: "object",
            properties: {
              drainPercent: {
                type: "number",
              },
              alarms: {
                type: "object",
                properties: {
                  alarmNames: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  enable: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              bakeTimeInMinutes: {
                type: "number",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        tags: {
          name: "tags",
          description:
            "The metadata that you apply to the daemon to help you categorize and organize them.",
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
        propagateTags: {
          name: "propagate Tags",
          description:
            "Specifies whether to propagate the tags from the daemon to the daemon tasks.",
          type: {
            type: "string",
            enum: ["DAEMON", "NONE"],
          },
          required: false,
        },
        enableECSManagedTags: {
          name: "enable ECS Managed Tags",
          description:
            "Specifies whether to turn on Amazon ECS managed tags for the tasks in the daemon.",
          type: "boolean",
          required: false,
        },
        enableExecuteCommand: {
          name: "enable Execute Command",
          description:
            "Determines whether the execute command functionality is turned on for the daemon.",
          type: "boolean",
          required: false,
        },
        clientToken: {
          name: "client Token",
          description:
            "An identifier that you provide to ensure the idempotency of the request.",
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

        const command = new CreateDaemonCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Daemon Result",
      description: "Result from CreateDaemon operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          daemonArn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the daemon.",
          },
          status: {
            type: "string",
            enum: ["ACTIVE", "DELETE_IN_PROGRESS"],
            description: "The status of the daemon.",
          },
          createdAt: {
            type: "string",
            description:
              "The Unix timestamp for the time when the daemon was created.",
          },
          deploymentArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the initial daemon deployment.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createDaemon;

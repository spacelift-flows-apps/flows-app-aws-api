import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, UpdateDaemonCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateDaemon: AppBlock = {
  name: "Update Daemon",
  description: `Updates the specified daemon.`,
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
        daemonArn: {
          name: "daemon Arn",
          description:
            "The Amazon Resource Name (ARN) of the daemon to update.",
          type: "string",
          required: true,
        },
        daemonTaskDefinitionArn: {
          name: "daemon Task Definition Arn",
          description:
            "The Amazon Resource Name (ARN) of the daemon task definition to use for the updated daemon.",
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
        propagateTags: {
          name: "propagate Tags",
          description:
            "Specifies whether to propagate the tags from the daemon to the daemon tasks.",
          type: "string",
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
            "If true, the execute command functionality is turned on for all tasks in the daemon.",
          type: "boolean",
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

        const command = new UpdateDaemonCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Daemon Result",
      description: "Result from UpdateDaemon operation",
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
            description: "The status of the daemon.",
          },
          createdAt: {
            type: "string",
            description:
              "The Unix timestamp for the time when the daemon was created.",
          },
          updatedAt: {
            type: "string",
            description:
              "The Unix timestamp for the time when the daemon was last updated.",
          },
          deploymentArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the daemon deployment that was triggered by the update.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateDaemon;

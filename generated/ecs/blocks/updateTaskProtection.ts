import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, UpdateTaskProtectionCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateTaskProtection: AppBlock = {
  name: "Update Task Protection",
  description: `Updates the protection status of a task.`,
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
            "The short name or full Amazon Resource Name (ARN) of the cluster that hosts the service that the task sets exist in.",
          type: "string",
          required: true,
        },
        tasks: {
          name: "tasks",
          description: "A list of up to 10 task IDs or full ARN entries.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        protectionEnabled: {
          name: "protection Enabled",
          description:
            "Specify true to mark a task for protection and false to unset protection, making it eligible for termination.",
          type: "boolean",
          required: true,
        },
        expiresInMinutes: {
          name: "expires In Minutes",
          description:
            "If you set protectionEnabled to true, you can specify the duration for task protection in minutes.",
          type: "number",
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

        const command = new UpdateTaskProtectionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Task Protection Result",
      description: "Result from UpdateTaskProtection operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          protectedTasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                taskArn: {
                  type: "string",
                },
                protectionEnabled: {
                  type: "boolean",
                },
                expirationDate: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of tasks with the following information.",
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

export default updateTaskProtection;

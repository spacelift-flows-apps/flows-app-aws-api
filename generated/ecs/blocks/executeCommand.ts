import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, ExecuteCommandCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const executeCommand: AppBlock = {
  name: "Execute Command",
  description: `Runs a command remotely on a container within a task.`,
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
            "The Amazon Resource Name (ARN) or short name of the cluster the task is running in.",
          type: "string",
          required: false,
        },
        container: {
          name: "container",
          description: "The name of the container to execute the command on.",
          type: "string",
          required: false,
        },
        command: {
          name: "command",
          description: "The command to run on the container.",
          type: "string",
          required: true,
        },
        interactive: {
          name: "interactive",
          description: "Use this flag to run your command in interactive mode.",
          type: "boolean",
          required: true,
        },
        task: {
          name: "task",
          description:
            "The Amazon Resource Name (ARN) or ID of the task the container is part of.",
          type: "string",
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

        const command = new ExecuteCommandCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Execute Command Result",
      description: "Result from ExecuteCommand operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          clusterArn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the cluster.",
          },
          containerArn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the container.",
          },
          containerName: {
            type: "string",
            description: "The name of the container.",
          },
          interactive: {
            type: "boolean",
            description:
              "Determines whether the execute command session is running in interactive mode.",
          },
          session: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
              },
              streamUrl: {
                type: "string",
              },
              tokenValue: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The details of the SSM session that was created for this instance of execute-command.",
          },
          taskArn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the task.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default executeCommand;

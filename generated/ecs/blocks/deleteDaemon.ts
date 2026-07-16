import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, DeleteDaemonCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteDaemon: AppBlock = {
  name: "Delete Daemon",
  description: `Deletes the specified daemon.`,
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
            "The Amazon Resource Name (ARN) of the daemon to delete.",
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

        const command = new DeleteDaemonCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Daemon Result",
      description: "Result from DeleteDaemon operation",
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
          updatedAt: {
            type: "string",
            description:
              "The Unix timestamp for the time when the daemon was last updated.",
          },
          deploymentArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the daemon deployment that was triggered by the delete operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteDaemon;

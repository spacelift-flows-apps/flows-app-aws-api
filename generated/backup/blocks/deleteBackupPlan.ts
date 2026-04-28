import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, DeleteBackupPlanCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteBackupPlan: AppBlock = {
  name: "Delete Backup Plan",
  description: `Deletes a backup plan.`,
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
        BackupPlanId: {
          name: "Backup Plan Id",
          description: "Uniquely identifies a backup plan.",
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

        const client = new BackupClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeleteBackupPlanCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Backup Plan Result",
      description: "Result from DeleteBackupPlan operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BackupPlanId: {
            type: "string",
            description: "Uniquely identifies a backup plan.",
          },
          BackupPlanArn: {
            type: "string",
            description:
              "An Amazon Resource Name (ARN) that uniquely identifies a backup plan; for example, arn:aws:backup:us-east-1:123456789012:plan:8F81F553-3A74-4A3F-B93D-B3360DC80C50.",
          },
          DeletionDate: {
            type: "string",
            description:
              "The date and time a backup plan is deleted, in Unix format and Coordinated Universal Time (UTC).",
          },
          VersionId: {
            type: "string",
            description:
              "Unique, randomly generated, Unicode, UTF-8 encoded strings that are at most 1,024 bytes long.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteBackupPlan;

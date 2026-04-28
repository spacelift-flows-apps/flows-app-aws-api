import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  UpdateRecoveryPointLifecycleCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateRecoveryPointLifecycle: AppBlock = {
  name: "Update Recovery Point Lifecycle",
  description: `Sets the transition lifecycle of a recovery point.`,
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
        BackupVaultName: {
          name: "Backup Vault Name",
          description:
            "The name of a logical container where backups are stored.",
          type: "string",
          required: true,
        },
        RecoveryPointArn: {
          name: "Recovery Point Arn",
          description:
            "An Amazon Resource Name (ARN) that uniquely identifies a recovery point; for example, arn:aws:backup:us-east-1:123456789012:recovery-point:1EB3B5E7-9EB0-435A-A80B-108B488B0D45.",
          type: "string",
          required: true,
        },
        Lifecycle: {
          name: "Lifecycle",
          description:
            "The lifecycle defines when a protected resource is transitioned to cold storage and when it expires.",
          type: {
            type: "object",
            properties: {
              MoveToColdStorageAfterDays: {
                type: "number",
              },
              DeleteAfterDays: {
                type: "number",
              },
              OptInToArchiveForSupportedResources: {
                type: "boolean",
              },
              DeleteAfterEvent: {
                type: "string",
              },
            },
            additionalProperties: false,
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

        const client = new BackupClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateRecoveryPointLifecycleCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Recovery Point Lifecycle Result",
      description: "Result from UpdateRecoveryPointLifecycle operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BackupVaultArn: {
            type: "string",
            description:
              "An ARN that uniquely identifies a backup vault; for example, arn:aws:backup:us-east-1:123456789012:backup-vault:aBackupVault.",
          },
          RecoveryPointArn: {
            type: "string",
            description:
              "An Amazon Resource Name (ARN) that uniquely identifies a recovery point; for example, arn:aws:backup:us-east-1:123456789012:recovery-point:1EB3B5E7-9EB0-435A-A80B-108B488B0D45.",
          },
          Lifecycle: {
            type: "object",
            properties: {
              MoveToColdStorageAfterDays: {
                type: "number",
              },
              DeleteAfterDays: {
                type: "number",
              },
              OptInToArchiveForSupportedResources: {
                type: "boolean",
              },
              DeleteAfterEvent: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The lifecycle defines when a protected resource is transitioned to cold storage and when it expires.",
          },
          CalculatedLifecycle: {
            type: "object",
            properties: {
              MoveToColdStorageAt: {
                type: "string",
              },
              DeleteAt: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "A CalculatedLifecycle object containing DeleteAt and MoveToColdStorageAt timestamps.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateRecoveryPointLifecycle;

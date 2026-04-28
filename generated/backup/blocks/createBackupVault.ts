import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, CreateBackupVaultCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createBackupVault: AppBlock = {
  name: "Create Backup Vault",
  description: `Creates a logical container where backups are stored.`,
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
        BackupVaultTags: {
          name: "Backup Vault Tags",
          description: "The tags to assign to the backup vault.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        EncryptionKeyArn: {
          name: "Encryption Key Arn",
          description:
            "The server-side encryption key that is used to protect your backups; for example, arn:aws:kms:us-west-2:111122223333:key/1234abcd-12ab-34cd-56ef-1234567890ab.",
          type: "string",
          required: false,
        },
        CreatorRequestId: {
          name: "Creator Request Id",
          description:
            "A unique string that identifies the request and allows failed requests to be retried without the risk of running the operation twice.",
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

        const client = new BackupClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateBackupVaultCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Backup Vault Result",
      description: "Result from CreateBackupVault operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BackupVaultName: {
            type: "string",
            description:
              "The name of a logical container where backups are stored.",
          },
          BackupVaultArn: {
            type: "string",
            description:
              "An Amazon Resource Name (ARN) that uniquely identifies a backup vault; for example, arn:aws:backup:us-east-1:123456789012:backup-vault:aBackupVault.",
          },
          CreationDate: {
            type: "string",
            description:
              "The date and time a backup vault is created, in Unix format and Coordinated Universal Time (UTC).",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createBackupVault;

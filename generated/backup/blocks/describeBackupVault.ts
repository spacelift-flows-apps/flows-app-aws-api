import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  DescribeBackupVaultCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeBackupVault: AppBlock = {
  name: "Describe Backup Vault",
  description: `Returns metadata about a backup vault specified by its name.`,
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
        BackupVaultAccountId: {
          name: "Backup Vault Account Id",
          description: "The account ID of the specified backup vault.",
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

        const command = new DescribeBackupVaultCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Backup Vault Result",
      description: "Result from DescribeBackupVault operation",
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
          VaultType: {
            type: "string",
            description: "The type of vault described.",
          },
          VaultState: {
            type: "string",
            description: "The current state of the vault.",
          },
          EncryptionKeyArn: {
            type: "string",
            description:
              "The server-side encryption key that is used to protect your backups; for example, arn:aws:kms:us-west-2:111122223333:key/1234abcd-12ab-34cd-56ef-1234567890ab.",
          },
          CreationDate: {
            type: "string",
            description:
              "The date and time that a backup vault is created, in Unix format and Coordinated Universal Time (UTC).",
          },
          CreatorRequestId: {
            type: "string",
            description:
              "A unique string that identifies the request and allows failed requests to be retried without the risk of running the operation twice.",
          },
          NumberOfRecoveryPoints: {
            type: "number",
            description:
              "The number of recovery points that are stored in a backup vault.",
          },
          Locked: {
            type: "boolean",
            description:
              "A Boolean that indicates whether Backup Vault Lock is currently protecting the backup vault.",
          },
          MinRetentionDays: {
            type: "number",
            description:
              "The Backup Vault Lock setting that specifies the minimum retention period that the vault retains its recovery points.",
          },
          MaxRetentionDays: {
            type: "number",
            description:
              "The Backup Vault Lock setting that specifies the maximum retention period that the vault retains its recovery points.",
          },
          LockDate: {
            type: "string",
            description:
              "The date and time when Backup Vault Lock configuration cannot be changed or deleted.",
          },
          SourceBackupVaultArn: {
            type: "string",
            description:
              "The ARN of the source backup vault from which this restore access backup vault was created.",
          },
          MpaApprovalTeamArn: {
            type: "string",
            description:
              "The ARN of the MPA approval team associated with this backup vault.",
          },
          MpaSessionArn: {
            type: "string",
            description:
              "The ARN of the MPA session associated with this backup vault.",
          },
          LatestMpaApprovalTeamUpdate: {
            type: "object",
            properties: {
              MpaSessionArn: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              StatusMessage: {
                type: "string",
              },
              InitiationDate: {
                type: "string",
              },
              ExpiryDate: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Information about the latest update to the MPA approval team association for this backup vault.",
          },
          EncryptionKeyType: {
            type: "string",
            description:
              "The type of encryption key used for the backup vault.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeBackupVault;

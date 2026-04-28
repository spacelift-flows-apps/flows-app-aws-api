import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  DescribeRecoveryPointCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeRecoveryPoint: AppBlock = {
  name: "Describe Recovery Point",
  description: `Returns metadata associated with a recovery point, including ID, status, encryption, and lifecycle.`,
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

        const command = new DescribeRecoveryPointCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Recovery Point Result",
      description: "Result from DescribeRecoveryPoint operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RecoveryPointArn: {
            type: "string",
            description:
              "An ARN that uniquely identifies a recovery point; for example, arn:aws:backup:us-east-1:123456789012:recovery-point:1EB3B5E7-9EB0-435A-A80B-108B488B0D45.",
          },
          BackupVaultName: {
            type: "string",
            description:
              "The name of a logical container where backups are stored.",
          },
          BackupVaultArn: {
            type: "string",
            description:
              "An ARN that uniquely identifies a backup vault; for example, arn:aws:backup:us-east-1:123456789012:backup-vault:aBackupVault.",
          },
          SourceBackupVaultArn: {
            type: "string",
            description:
              "An Amazon Resource Name (ARN) that uniquely identifies the source vault where the resource was originally backed up in; for example, arn:aws:backup:us-east-1:123456789012:backup-vault:aBackupVault.",
          },
          ResourceArn: {
            type: "string",
            description: "An ARN that uniquely identifies a saved resource.",
          },
          ResourceType: {
            type: "string",
            description:
              "The type of Amazon Web Services resource to save as a recovery point; for example, an Amazon Elastic Block Store (Amazon EBS) volume or an Amazon Relational Database Service (Amazon RDS) database.",
          },
          CreatedBy: {
            type: "object",
            properties: {
              BackupPlanId: {
                type: "string",
              },
              BackupPlanArn: {
                type: "string",
              },
              BackupPlanName: {
                type: "string",
              },
              BackupPlanVersion: {
                type: "string",
              },
              BackupRuleId: {
                type: "string",
              },
              BackupRuleName: {
                type: "string",
              },
              BackupRuleCron: {
                type: "string",
              },
              BackupRuleTimezone: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Contains identifying information about the creation of a recovery point, including the BackupPlanArn, BackupPlanId, BackupPlanVersion, and BackupRuleId of the backup plan used to create it.",
          },
          IamRoleArn: {
            type: "string",
            description:
              "Specifies the IAM role ARN used to create the target recovery point; for example, arn:aws:iam::123456789012:role/S3Access.",
          },
          Status: {
            type: "string",
            description:
              "A status code specifying the state of the recovery point.",
          },
          StatusMessage: {
            type: "string",
            description:
              "A status message explaining the status of the recovery point.",
          },
          CreationDate: {
            type: "string",
            description:
              "The date and time that a recovery point is created, in Unix format and Coordinated Universal Time (UTC).",
          },
          InitiationDate: {
            type: "string",
            description:
              "The date and time when the backup job that created this recovery point was initiated, in Unix format and Coordinated Universal Time (UTC).",
          },
          CompletionDate: {
            type: "string",
            description:
              "The date and time that a job to create a recovery point is completed, in Unix format and Coordinated Universal Time (UTC).",
          },
          BackupSizeInBytes: {
            type: "number",
            description: "The size, in bytes, of a backup.",
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
          EncryptionKeyArn: {
            type: "string",
            description:
              "The server-side encryption key used to protect your backups; for example, arn:aws:kms:us-west-2:111122223333:key/1234abcd-12ab-34cd-56ef-1234567890ab.",
          },
          IsEncrypted: {
            type: "boolean",
            description:
              "A Boolean value that is returned as TRUE if the specified recovery point is encrypted, or FALSE if the recovery point is not encrypted.",
          },
          StorageClass: {
            type: "string",
            description: "Specifies the storage class of the recovery point.",
          },
          LastRestoreTime: {
            type: "string",
            description:
              "The date and time that a recovery point was last restored, in Unix format and Coordinated Universal Time (UTC).",
          },
          ParentRecoveryPointArn: {
            type: "string",
            description:
              "This is an ARN that uniquely identifies a parent (composite) recovery point; for example, arn:aws:backup:us-east-1:123456789012:recovery-point:1EB3B5E7-9EB0-435A-A80B-108B488B0D45.",
          },
          CompositeMemberIdentifier: {
            type: "string",
            description:
              "The identifier of a resource within a composite group, such as nested (child) recovery point belonging to a composite (parent) stack.",
          },
          IsParent: {
            type: "boolean",
            description:
              "This returns the boolean value that a recovery point is a parent (composite) job.",
          },
          ResourceName: {
            type: "string",
            description:
              "The name of the resource that belongs to the specified backup.",
          },
          VaultType: {
            type: "string",
            description:
              "The type of vault in which the described recovery point is stored.",
          },
          IndexStatus: {
            type: "string",
            description:
              "This is the current status for the backup index associated with the specified recovery point.",
          },
          IndexStatusMessage: {
            type: "string",
            description:
              "A string in the form of a detailed message explaining the status of a backup index associated with the recovery point.",
          },
          EncryptionKeyType: {
            type: "string",
            description:
              "The type of encryption key used for the recovery point.",
          },
          ScanResults: {
            type: "array",
            items: {
              type: "object",
              properties: {
                MalwareScanner: {
                  type: "string",
                },
                ScanJobState: {
                  type: "string",
                },
                LastScanTimestamp: {
                  type: "string",
                },
                Findings: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "Contains the latest scanning results against the recovery point and currently include MalwareScanner...",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeRecoveryPoint;

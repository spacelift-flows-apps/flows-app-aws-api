import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, DescribeBackupJobCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeBackupJob: AppBlock = {
  name: "Describe Backup Job",
  description: `Returns backup job details for the specified BackupJobId.`,
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
        BackupJobId: {
          name: "Backup Job Id",
          description:
            "Uniquely identifies a request to Backup to back up a resource.",
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

        const command = new DescribeBackupJobCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Backup Job Result",
      description: "Result from DescribeBackupJob operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AccountId: {
            type: "string",
            description: "Returns the account ID that owns the backup job.",
          },
          BackupJobId: {
            type: "string",
            description:
              "Uniquely identifies a request to Backup to back up a resource.",
          },
          BackupVaultName: {
            type: "string",
            description:
              "The name of a logical container where backups are stored.",
          },
          RecoveryPointLifecycle: {
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
              "Specifies the time period, in days, before a recovery point transitions to cold storage or is deleted.",
          },
          BackupVaultArn: {
            type: "string",
            description:
              "An Amazon Resource Name (ARN) that uniquely identifies a backup vault; for example, arn:aws:backup:us-east-1:123456789012:backup-vault:aBackupVault.",
          },
          VaultType: {
            type: "string",
            description:
              "The type of backup vault where the recovery point is stored.",
          },
          VaultLockState: {
            type: "string",
            description: "The lock state of the backup vault.",
          },
          RecoveryPointArn: {
            type: "string",
            description:
              "An ARN that uniquely identifies a recovery point; for example, arn:aws:backup:us-east-1:123456789012:recovery-point:1EB3B5E7-9EB0-435A-A80B-108B488B0D45.",
          },
          EncryptionKeyArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the KMS key used to encrypt the backup.",
          },
          IsEncrypted: {
            type: "boolean",
            description:
              "A boolean value indicating whether the backup is encrypted.",
          },
          ResourceArn: {
            type: "string",
            description: "An ARN that uniquely identifies a saved resource.",
          },
          CreationDate: {
            type: "string",
            description:
              "The date and time that a backup job is created, in Unix format and Coordinated Universal Time (UTC).",
          },
          CompletionDate: {
            type: "string",
            description:
              "The date and time that a job to create a backup job is completed, in Unix format and Coordinated Universal Time (UTC).",
          },
          State: {
            type: "string",
            description: "The current state of a backup job.",
          },
          StatusMessage: {
            type: "string",
            description:
              "A detailed message explaining the status of the job to back up a resource.",
          },
          PercentDone: {
            type: "string",
            description:
              "Contains an estimated percentage that is complete of a job at the time the job status was queried.",
          },
          BackupSizeInBytes: {
            type: "number",
            description: "The size, in bytes, of a backup (recovery point).",
          },
          IamRoleArn: {
            type: "string",
            description:
              "Specifies the IAM role ARN used to create the target recovery point; for example, arn:aws:iam::123456789012:role/S3Access.",
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
              "Contains identifying information about the creation of a backup job, including the BackupPlanArn, BackupPlanId, BackupPlanVersion, and BackupRuleId of the backup plan that is used to create it.",
          },
          ResourceType: {
            type: "string",
            description:
              "The type of Amazon Web Services resource to be backed up; for example, an Amazon Elastic Block Store (Amazon EBS) volume or an Amazon Relational Database Service (Amazon RDS) database.",
          },
          BytesTransferred: {
            type: "number",
            description:
              "The size in bytes transferred to a backup vault at the time that the job status was queried.",
          },
          ExpectedCompletionDate: {
            type: "string",
            description:
              "The date and time that a job to back up resources is expected to be completed, in Unix format and Coordinated Universal Time (UTC).",
          },
          StartBy: {
            type: "string",
            description:
              "Specifies the time in Unix format and Coordinated Universal Time (UTC) when a backup job must be started before it is canceled.",
          },
          BackupOptions: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
            description:
              "Represents the options specified as part of backup plan or on-demand backup job.",
          },
          BackupType: {
            type: "string",
            description:
              "Represents the actual backup type selected for a backup job.",
          },
          ParentJobId: {
            type: "string",
            description:
              "This returns the parent (composite) resource backup job ID.",
          },
          IsParent: {
            type: "boolean",
            description:
              "This returns the boolean value that a backup job is a parent (composite) job.",
          },
          NumberOfChildJobs: {
            type: "number",
            description:
              "This returns the number of child (nested) backup jobs.",
          },
          ChildJobsInState: {
            type: "object",
            additionalProperties: {
              type: "number",
            },
            description:
              "This returns the statistics of the included child (nested) backup jobs.",
          },
          ResourceName: {
            type: "string",
            description:
              "The non-unique name of the resource that belongs to the specified backup.",
          },
          InitiationDate: {
            type: "string",
            description: "The date a backup job was initiated.",
          },
          MessageCategory: {
            type: "string",
            description: "The job count for the specified message category.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeBackupJob;

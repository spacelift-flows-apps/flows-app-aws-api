import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, StartCopyJobCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startCopyJob: AppBlock = {
  name: "Start Copy Job",
  description: `Starts a job to create a one-time copy of the specified resource.`,
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
        RecoveryPointArn: {
          name: "Recovery Point Arn",
          description:
            "An ARN that uniquely identifies a recovery point to use for the copy job; for example, arn:aws:backup:us-east-1:123456789012:recovery-point:1EB3B5E7-9EB0-435A-A80B-108B488B0D45.",
          type: "string",
          required: true,
        },
        SourceBackupVaultName: {
          name: "Source Backup Vault Name",
          description:
            "The name of a logical source container where backups are stored.",
          type: "string",
          required: true,
        },
        DestinationBackupVaultArn: {
          name: "Destination Backup Vault Arn",
          description:
            "An Amazon Resource Name (ARN) that uniquely identifies a destination backup vault to copy to; for example, arn:aws:backup:us-east-1:123456789012:backup-vault:aBackupVault.",
          type: "string",
          required: true,
        },
        IamRoleArn: {
          name: "Iam Role Arn",
          description:
            "Specifies the IAM role ARN used to copy the target recovery point; for example, arn:aws:iam::123456789012:role/S3Access.",
          type: "string",
          required: true,
        },
        IdempotencyToken: {
          name: "Idempotency Token",
          description:
            "A customer-chosen string that you can use to distinguish between otherwise identical calls to StartCopyJob.",
          type: "string",
          required: false,
        },
        Lifecycle: {
          name: "Lifecycle",
          description:
            "Specifies the time period, in days, before a recovery point transitions to cold storage or is deleted.",
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

        const command = new StartCopyJobCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Copy Job Result",
      description: "Result from StartCopyJob operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CopyJobId: {
            type: "string",
            description: "Uniquely identifies a copy job.",
          },
          CreationDate: {
            type: "string",
            description:
              "The date and time that a copy job is created, in Unix format and Coordinated Universal Time (UTC).",
          },
          IsParent: {
            type: "boolean",
            description:
              "This is a returned boolean value indicating this is a parent (composite) copy job.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startCopyJob;

import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, StartBackupJobCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startBackupJob: AppBlock = {
  name: "Start Backup Job",
  description: `Starts an on-demand backup job for the specified resource.`,
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
        LogicallyAirGappedBackupVaultArn: {
          name: "Logically Air Gapped Backup Vault Arn",
          description: "The ARN of a logically air-gapped vault.",
          type: "string",
          required: false,
        },
        ResourceArn: {
          name: "Resource Arn",
          description:
            "An Amazon Resource Name (ARN) that uniquely identifies a resource.",
          type: "string",
          required: true,
        },
        IamRoleArn: {
          name: "Iam Role Arn",
          description:
            "Specifies the IAM role ARN used to create the target recovery point; for example, arn:aws:iam::123456789012:role/S3Access.",
          type: "string",
          required: true,
        },
        IdempotencyToken: {
          name: "Idempotency Token",
          description:
            "A customer-chosen string that you can use to distinguish between otherwise identical calls to StartBackupJob.",
          type: "string",
          required: false,
        },
        StartWindowMinutes: {
          name: "Start Window Minutes",
          description:
            "A value in minutes after a backup is scheduled before a job will be canceled if it doesn't start successfully.",
          type: "number",
          required: false,
        },
        CompleteWindowMinutes: {
          name: "Complete Window Minutes",
          description:
            "A value in minutes during which a successfully started backup must complete, or else Backup will cancel the job.",
          type: "number",
          required: false,
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
        RecoveryPointTags: {
          name: "Recovery Point Tags",
          description: "The tags to assign to the resources.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        BackupOptions: {
          name: "Backup Options",
          description: "The backup option for a selected resource.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        Index: {
          name: "Index",
          description:
            "Include this parameter to enable index creation if your backup job has a resource type that supports backup indexes.",
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

        const command = new StartBackupJobCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Backup Job Result",
      description: "Result from StartBackupJob operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BackupJobId: {
            type: "string",
            description:
              "Uniquely identifies a request to Backup to back up a resource.",
          },
          RecoveryPointArn: {
            type: "string",
            description:
              "Note: This field is only returned for Amazon EFS and Advanced DynamoDB resources.",
          },
          CreationDate: {
            type: "string",
            description:
              "The date and time that a backup job is created, in Unix format and Coordinated Universal Time (UTC).",
          },
          IsParent: {
            type: "boolean",
            description:
              "This is a returned boolean value indicating this is a parent (composite) backup job.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startBackupJob;

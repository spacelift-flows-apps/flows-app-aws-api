import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  CreateRestoreAccessBackupVaultCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createRestoreAccessBackupVault: AppBlock = {
  name: "Create Restore Access Backup Vault",
  description: `Creates a restore access backup vault that provides temporary access to recovery points in a logically air-gapped backup vault, subject to MPA approval.`,
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
        SourceBackupVaultArn: {
          name: "Source Backup Vault Arn",
          description:
            "The ARN of the source backup vault containing the recovery points to which temporary access is requested.",
          type: "string",
          required: true,
        },
        BackupVaultName: {
          name: "Backup Vault Name",
          description:
            "The name of the backup vault to associate with an MPA approval team.",
          type: "string",
          required: false,
        },
        BackupVaultTags: {
          name: "Backup Vault Tags",
          description:
            "Optional tags to assign to the restore access backup vault.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        CreatorRequestId: {
          name: "Creator Request Id",
          description:
            "A unique string that identifies the request and allows failed requests to be retried without the risk of executing the operation twice.",
          type: "string",
          required: false,
        },
        RequesterComment: {
          name: "Requester Comment",
          description:
            "A comment explaining the reason for requesting restore access to the backup vault.",
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

        const command = new CreateRestoreAccessBackupVaultCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Restore Access Backup Vault Result",
      description: "Result from CreateRestoreAccessBackupVault operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RestoreAccessBackupVaultArn: {
            type: "string",
            description:
              "The ARN that uniquely identifies the created restore access backup vault.",
          },
          VaultState: {
            type: "string",
            description:
              "The current state of the restore access backup vault.",
          },
          RestoreAccessBackupVaultName: {
            type: "string",
            description: "The name of the created restore access backup vault.",
          },
          CreationDate: {
            type: "string",
            description:
              ">The date and time when the restore access backup vault was created, in Unix format and Coordinated ...",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createRestoreAccessBackupVault;

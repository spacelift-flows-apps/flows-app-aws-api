import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  CreateLogicallyAirGappedBackupVaultCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createLogicallyAirGappedBackupVault: AppBlock = {
  name: "Create Logically Air Gapped Backup Vault",
  description: `Creates a logical container to where backups may be copied.`,
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
          description: "The tags to assign to the vault.",
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
          description: "The ID of the creation request.",
          type: "string",
          required: false,
        },
        MinRetentionDays: {
          name: "Min Retention Days",
          description:
            "This setting specifies the minimum retention period that the vault retains its recovery points.",
          type: "number",
          required: true,
        },
        MaxRetentionDays: {
          name: "Max Retention Days",
          description:
            "The maximum retention period that the vault retains its recovery points.",
          type: "number",
          required: true,
        },
        EncryptionKeyArn: {
          name: "Encryption Key Arn",
          description:
            "The ARN of the customer-managed KMS key to use for encrypting the logically air-gapped backup vault.",
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

        const command = new CreateLogicallyAirGappedBackupVaultCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Logically Air Gapped Backup Vault Result",
      description: "Result from CreateLogicallyAirGappedBackupVault operation",
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
            description: "The ARN (Amazon Resource Name) of the vault.",
          },
          CreationDate: {
            type: "string",
            description: "The date and time when the vault was created.",
          },
          VaultState: {
            type: "string",
            description: "The current state of the vault.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createLogicallyAirGappedBackupVault;

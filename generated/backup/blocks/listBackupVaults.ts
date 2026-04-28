import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, ListBackupVaultsCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listBackupVaults: AppBlock = {
  name: "List Backup Vaults",
  description: `Returns a list of recovery point storage containers along with information about them.`,
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
        ByVaultType: {
          name: "By Vault Type",
          description:
            "This parameter will sort the list of vaults by vault type.",
          type: "string",
          required: false,
        },
        ByShared: {
          name: "By Shared",
          description:
            "This parameter will sort the list of vaults by shared vaults.",
          type: "boolean",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The next item following a partial list of returned items.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to be returned.",
          type: "number",
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

        const command = new ListBackupVaultsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Backup Vaults Result",
      description: "Result from ListBackupVaults operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BackupVaultList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                BackupVaultName: {
                  type: "string",
                },
                BackupVaultArn: {
                  type: "string",
                },
                VaultType: {
                  type: "string",
                },
                VaultState: {
                  type: "string",
                },
                CreationDate: {
                  type: "string",
                },
                EncryptionKeyArn: {
                  type: "string",
                },
                CreatorRequestId: {
                  type: "string",
                },
                NumberOfRecoveryPoints: {
                  type: "number",
                },
                Locked: {
                  type: "boolean",
                },
                MinRetentionDays: {
                  type: "number",
                },
                MaxRetentionDays: {
                  type: "number",
                },
                LockDate: {
                  type: "string",
                },
                EncryptionKeyType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "An array of backup vault list members containing vault metadata, including Amazon Resource Name (ARN), display name, creation date, number of saved recovery points, and encryption information if the resources saved in the backup vault are encrypted.",
          },
          NextToken: {
            type: "string",
            description:
              "The next item following a partial list of returned items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listBackupVaults;

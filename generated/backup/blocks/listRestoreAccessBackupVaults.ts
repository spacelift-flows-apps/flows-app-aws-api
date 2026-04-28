import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  ListRestoreAccessBackupVaultsCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listRestoreAccessBackupVaults: AppBlock = {
  name: "List Restore Access Backup Vaults",
  description: `Returns a list of restore access backup vaults associated with a specified backup vault.`,
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
            "The name of the backup vault for which to list associated restore access backup vaults.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The pagination token from a previous request to retrieve the next set of results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return in the response.",
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

        const command = new ListRestoreAccessBackupVaultsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Restore Access Backup Vaults Result",
      description: "Result from ListRestoreAccessBackupVaults operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The pagination token to use in a subsequent request to retrieve the next set of results.",
          },
          RestoreAccessBackupVaults: {
            type: "array",
            items: {
              type: "object",
              properties: {
                RestoreAccessBackupVaultArn: {
                  type: "string",
                },
                CreationDate: {
                  type: "string",
                },
                ApprovalDate: {
                  type: "string",
                },
                VaultState: {
                  type: "string",
                },
                LatestRevokeRequest: {
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
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of restore access backup vaults associated with the specified backup vault.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listRestoreAccessBackupVaults;

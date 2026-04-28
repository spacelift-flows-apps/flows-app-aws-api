import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  ListProtectedResourcesByBackupVaultCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listProtectedResourcesByBackupVault: AppBlock = {
  name: "List Protected Resources By Backup Vault",
  description: `This request lists the protected resources corresponding to each backup vault.`,
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
            "The list of protected resources by backup vault within the vault(s) you specify by name.",
          type: "string",
          required: true,
        },
        BackupVaultAccountId: {
          name: "Backup Vault Account Id",
          description:
            "The list of protected resources by backup vault within the vault(s) you specify by account ID.",
          type: "string",
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

        const command = new ListProtectedResourcesByBackupVaultCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Protected Resources By Backup Vault Result",
      description: "Result from ListProtectedResourcesByBackupVault operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ResourceArn: {
                  type: "string",
                },
                ResourceType: {
                  type: "string",
                },
                LastBackupTime: {
                  type: "string",
                },
                ResourceName: {
                  type: "string",
                },
                LastBackupVaultArn: {
                  type: "string",
                },
                LastRecoveryPointArn: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "These are the results returned for the request ListProtectedResourcesByBackupVault.",
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

export default listProtectedResourcesByBackupVault;

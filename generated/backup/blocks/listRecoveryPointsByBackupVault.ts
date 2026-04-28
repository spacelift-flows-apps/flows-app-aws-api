import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  ListRecoveryPointsByBackupVaultCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const listRecoveryPointsByBackupVault: AppBlock = {
  name: "List Recovery Points By Backup Vault",
  description: `Returns detailed information about the recovery points stored in a backup vault.`,
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
          description:
            "This parameter will sort the list of recovery points by account ID.",
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
        ByResourceArn: {
          name: "By Resource Arn",
          description:
            "Returns only recovery points that match the specified resource Amazon Resource Name (ARN).",
          type: "string",
          required: false,
        },
        ByResourceType: {
          name: "By Resource Type",
          description:
            "Returns only recovery points that match the specified resource type(s): Aurora for Amazon Aurora Clo...",
          type: "string",
          required: false,
        },
        ByBackupPlanId: {
          name: "By Backup Plan Id",
          description:
            "Returns only recovery points that match the specified backup plan ID.",
          type: "string",
          required: false,
        },
        ByCreatedBefore: {
          name: "By Created Before",
          description:
            "Returns only recovery points that were created before the specified timestamp.",
          type: "string",
          required: false,
        },
        ByCreatedAfter: {
          name: "By Created After",
          description:
            "Returns only recovery points that were created after the specified timestamp.",
          type: "string",
          required: false,
        },
        ByParentRecoveryPointArn: {
          name: "By Parent Recovery Point Arn",
          description:
            "This returns only recovery points that match the specified parent (composite) recovery point Amazon Resource Name (ARN).",
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

        const command = new ListRecoveryPointsByBackupVaultCommand(
          convertTimestamps(
            commandInput,
            new Set(["ByCreatedBefore", "ByCreatedAfter"]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Recovery Points By Backup Vault Result",
      description: "Result from ListRecoveryPointsByBackupVault operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The next item following a partial list of returned items.",
          },
          RecoveryPoints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                RecoveryPointArn: {
                  type: "string",
                },
                BackupVaultName: {
                  type: "string",
                },
                BackupVaultArn: {
                  type: "string",
                },
                SourceBackupVaultArn: {
                  type: "string",
                },
                ResourceArn: {
                  type: "string",
                },
                ResourceType: {
                  type: "string",
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
                },
                IamRoleArn: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                StatusMessage: {
                  type: "string",
                },
                CreationDate: {
                  type: "string",
                },
                InitiationDate: {
                  type: "string",
                },
                CompletionDate: {
                  type: "string",
                },
                BackupSizeInBytes: {
                  type: "number",
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
                },
                EncryptionKeyArn: {
                  type: "string",
                },
                IsEncrypted: {
                  type: "boolean",
                },
                LastRestoreTime: {
                  type: "string",
                },
                ParentRecoveryPointArn: {
                  type: "string",
                },
                CompositeMemberIdentifier: {
                  type: "string",
                },
                IsParent: {
                  type: "boolean",
                },
                ResourceName: {
                  type: "string",
                },
                VaultType: {
                  type: "string",
                },
                IndexStatus: {
                  type: "string",
                },
                IndexStatusMessage: {
                  type: "string",
                },
                EncryptionKeyType: {
                  type: "string",
                },
                AggregatedScanResult: {
                  type: "object",
                  properties: {
                    FailedScan: {
                      type: "boolean",
                    },
                    Findings: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    LastComputed: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description:
              "An array of objects that contain detailed information about recovery points saved in a backup vault.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listRecoveryPointsByBackupVault;

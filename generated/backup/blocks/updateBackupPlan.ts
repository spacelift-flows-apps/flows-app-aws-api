import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, UpdateBackupPlanCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateBackupPlan: AppBlock = {
  name: "Update Backup Plan",
  description: `Updates the specified backup plan.`,
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
        BackupPlanId: {
          name: "Backup Plan Id",
          description: "The ID of the backup plan.",
          type: "string",
          required: true,
        },
        BackupPlan: {
          name: "Backup Plan",
          description: "The body of a backup plan.",
          type: {
            type: "object",
            properties: {
              BackupPlanName: {
                type: "string",
              },
              Rules: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    RuleName: {
                      type: "string",
                    },
                    TargetBackupVaultName: {
                      type: "string",
                    },
                    TargetLogicallyAirGappedBackupVaultArn: {
                      type: "string",
                    },
                    ScheduleExpression: {
                      type: "string",
                    },
                    StartWindowMinutes: {
                      type: "number",
                    },
                    CompletionWindowMinutes: {
                      type: "number",
                    },
                    Lifecycle: {
                      type: "object",
                      properties: {
                        MoveToColdStorageAfterDays: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DeleteAfterDays: {
                          type: "object",
                          additionalProperties: true,
                        },
                        OptInToArchiveForSupportedResources: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DeleteAfterEvent: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    RecoveryPointTags: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                    CopyActions: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    EnableContinuousBackup: {
                      type: "boolean",
                    },
                    ScheduleExpressionTimezone: {
                      type: "string",
                    },
                    IndexActions: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    ScanActions: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["RuleName", "TargetBackupVaultName"],
                  additionalProperties: false,
                },
              },
              AdvancedBackupSettings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ResourceType: {
                      type: "string",
                    },
                    BackupOptions: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              ScanSettings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    MalwareScanner: {
                      type: "string",
                    },
                    ResourceTypes: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    ScannerRoleArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            required: ["BackupPlanName", "Rules"],
            additionalProperties: false,
          },
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

        const command = new UpdateBackupPlanCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Backup Plan Result",
      description: "Result from UpdateBackupPlan operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BackupPlanId: {
            type: "string",
            description: "Uniquely identifies a backup plan.",
          },
          BackupPlanArn: {
            type: "string",
            description:
              "An Amazon Resource Name (ARN) that uniquely identifies a backup plan; for example, arn:aws:backup:us-east-1:123456789012:plan:8F81F553-3A74-4A3F-B93D-B3360DC80C50.",
          },
          CreationDate: {
            type: "string",
            description:
              "The date and time a backup plan is created, in Unix format and Coordinated Universal Time (UTC).",
          },
          VersionId: {
            type: "string",
            description:
              "Unique, randomly generated, Unicode, UTF-8 encoded strings that are at most 1,024 bytes long.",
          },
          AdvancedBackupSettings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ResourceType: {
                  type: "string",
                },
                BackupOptions: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "Contains a list of BackupOptions for each resource type.",
          },
          ScanSettings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                MalwareScanner: {
                  type: "string",
                },
                ResourceTypes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                ScannerRoleArn: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Contains your scanning configuration for the backup plan and includes the Malware scanner, your selected resources, and scanner role.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateBackupPlan;

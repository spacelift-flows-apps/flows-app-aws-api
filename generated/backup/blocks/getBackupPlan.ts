import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, GetBackupPlanCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getBackupPlan: AppBlock = {
  name: "Get Backup Plan",
  description: `Returns BackupPlan details for the specified BackupPlanId.`,
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
          description: "Uniquely identifies a backup plan.",
          type: "string",
          required: true,
        },
        VersionId: {
          name: "Version Id",
          description:
            "Unique, randomly generated, Unicode, UTF-8 encoded strings that are at most 1,024 bytes long.",
          type: "string",
          required: false,
        },
        MaxScheduledRunsPreview: {
          name: "Max Scheduled Runs Preview",
          description: "Number of future scheduled backup runs to preview.",
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

        const command = new GetBackupPlanCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Backup Plan Result",
      description: "Result from GetBackupPlan operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BackupPlan: {
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
                    RuleId: {
                      type: "string",
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
            description: "Specifies the body of a backup plan.",
          },
          BackupPlanId: {
            type: "string",
            description: "Uniquely identifies a backup plan.",
          },
          BackupPlanArn: {
            type: "string",
            description:
              "An Amazon Resource Name (ARN) that uniquely identifies a backup plan; for example, arn:aws:backup:us-east-1:123456789012:plan:8F81F553-3A74-4A3F-B93D-B3360DC80C50.",
          },
          VersionId: {
            type: "string",
            description:
              "Unique, randomly generated, Unicode, UTF-8 encoded strings that are at most 1,024 bytes long.",
          },
          CreatorRequestId: {
            type: "string",
            description:
              "A unique string that identifies the request and allows failed requests to be retried without the risk of running the operation twice.",
          },
          CreationDate: {
            type: "string",
            description:
              "The date and time that a backup plan is created, in Unix format and Coordinated Universal Time (UTC).",
          },
          DeletionDate: {
            type: "string",
            description:
              "The date and time that a backup plan is deleted, in Unix format and Coordinated Universal Time (UTC).",
          },
          LastExecutionDate: {
            type: "string",
            description: "The last time this backup plan was run.",
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
          ScheduledRunsPreview: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ExecutionTime: {
                  type: "string",
                },
                RuleId: {
                  type: "string",
                },
                RuleExecutionType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "List of upcoming scheduled backup runs.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getBackupPlan;

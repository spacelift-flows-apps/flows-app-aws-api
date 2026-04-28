import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  GetBackupPlanFromTemplateCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getBackupPlanFromTemplate: AppBlock = {
  name: "Get Backup Plan From Template",
  description: `Returns the template specified by its templateId as a backup plan.`,
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
        BackupPlanTemplateId: {
          name: "Backup Plan Template Id",
          description: "Uniquely identifies a stored backup plan template.",
          type: "string",
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

        const command = new GetBackupPlanFromTemplateCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Backup Plan From Template Result",
      description: "Result from GetBackupPlanFromTemplate operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BackupPlanDocument: {
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
            description:
              "Returns the body of a backup plan based on the target template, including the name, rules, and backup vault of the plan.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getBackupPlanFromTemplate;

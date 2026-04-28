import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, ListBackupJobsCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const listBackupJobs: AppBlock = {
  name: "List Backup Jobs",
  description: `Returns a list of existing backup jobs for an authenticated account for the last 30 days.`,
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
            "Returns only backup jobs that match the specified resource Amazon Resource Name (ARN).",
          type: "string",
          required: false,
        },
        ByState: {
          name: "By State",
          description:
            "Returns only backup jobs that are in the specified state.",
          type: "string",
          required: false,
        },
        ByBackupVaultName: {
          name: "By Backup Vault Name",
          description:
            "Returns only backup jobs that will be stored in the specified backup vault.",
          type: "string",
          required: false,
        },
        ByCreatedBefore: {
          name: "By Created Before",
          description:
            "Returns only backup jobs that were created before the specified date.",
          type: "string",
          required: false,
        },
        ByCreatedAfter: {
          name: "By Created After",
          description:
            "Returns only backup jobs that were created after the specified date.",
          type: "string",
          required: false,
        },
        ByResourceType: {
          name: "By Resource Type",
          description:
            "Returns only backup jobs for the specified resources: Aurora for Amazon Aurora CloudFormation for Cl...",
          type: "string",
          required: false,
        },
        ByAccountId: {
          name: "By Account Id",
          description: "The account ID to list the jobs from.",
          type: "string",
          required: false,
        },
        ByCompleteAfter: {
          name: "By Complete After",
          description:
            "Returns only backup jobs completed after a date expressed in Unix format and Coordinated Universal Time (UTC).",
          type: "string",
          required: false,
        },
        ByCompleteBefore: {
          name: "By Complete Before",
          description:
            "Returns only backup jobs completed before a date expressed in Unix format and Coordinated Universal Time (UTC).",
          type: "string",
          required: false,
        },
        ByParentJobId: {
          name: "By Parent Job Id",
          description:
            "This is a filter to list child (nested) jobs based on parent job ID.",
          type: "string",
          required: false,
        },
        ByMessageCategory: {
          name: "By Message Category",
          description:
            "This is an optional parameter that can be used to filter out jobs with a MessageCategory which matches the value you input.",
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

        const command = new ListBackupJobsCommand(
          convertTimestamps(
            commandInput,
            new Set([
              "ByCreatedBefore",
              "ByCreatedAfter",
              "ByCompleteAfter",
              "ByCompleteBefore",
            ]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Backup Jobs Result",
      description: "Result from ListBackupJobs operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BackupJobs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AccountId: {
                  type: "string",
                },
                BackupJobId: {
                  type: "string",
                },
                BackupVaultName: {
                  type: "string",
                },
                BackupVaultArn: {
                  type: "string",
                },
                VaultType: {
                  type: "string",
                },
                VaultLockState: {
                  type: "string",
                },
                RecoveryPointArn: {
                  type: "string",
                },
                RecoveryPointLifecycle: {
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
                ResourceArn: {
                  type: "string",
                },
                CreationDate: {
                  type: "string",
                },
                CompletionDate: {
                  type: "string",
                },
                State: {
                  type: "string",
                },
                StatusMessage: {
                  type: "string",
                },
                PercentDone: {
                  type: "string",
                },
                BackupSizeInBytes: {
                  type: "number",
                },
                IamRoleArn: {
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
                ExpectedCompletionDate: {
                  type: "string",
                },
                StartBy: {
                  type: "string",
                },
                ResourceType: {
                  type: "string",
                },
                BytesTransferred: {
                  type: "number",
                },
                BackupOptions: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
                BackupType: {
                  type: "string",
                },
                ParentJobId: {
                  type: "string",
                },
                IsParent: {
                  type: "boolean",
                },
                ResourceName: {
                  type: "string",
                },
                InitiationDate: {
                  type: "string",
                },
                MessageCategory: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "An array of structures containing metadata about your backup jobs returned in JSON format.",
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

export default listBackupJobs;

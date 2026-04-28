import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, ListScanJobsCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listScanJobs: AppBlock = {
  name: "List Scan Jobs",
  description: `Returns a list of existing scan jobs for an authenticated account for the last 30 days.`,
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
        ByAccountId: {
          name: "By Account Id",
          description: "The account ID to list the jobs from.",
          type: "string",
          required: false,
        },
        ByBackupVaultName: {
          name: "By Backup Vault Name",
          description:
            "Returns only scan jobs that will be stored in the specified backup vault.",
          type: "string",
          required: false,
        },
        ByCompleteAfter: {
          name: "By Complete After",
          description:
            "Returns only scan jobs completed after a date expressed in Unix format and Coordinated Universal Time (UTC).",
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
        ByMalwareScanner: {
          name: "By Malware Scanner",
          description:
            "Returns only the scan jobs for the specified malware scanner.",
          type: "string",
          required: false,
        },
        ByRecoveryPointArn: {
          name: "By Recovery Point Arn",
          description:
            "Returns only the scan jobs that are ran against the specified recovery point.",
          type: "string",
          required: false,
        },
        ByResourceArn: {
          name: "By Resource Arn",
          description:
            "Returns only scan jobs that match the specified resource Amazon Resource Name (ARN).",
          type: "string",
          required: false,
        },
        ByResourceType: {
          name: "By Resource Type",
          description:
            "Returns restore testing selections by the specified restore testing plan name.",
          type: "string",
          required: false,
        },
        ByScanResultStatus: {
          name: "By Scan Result Status",
          description:
            "Returns only the scan jobs for the specified scan results: THREATS_FOUND NO_THREATS_FOUND",
          type: "string",
          required: false,
        },
        ByState: {
          name: "By State",
          description:
            "Returns only the scan jobs for the specified scanning job state.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to be returned.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The next item following a partial list of returned items.",
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

        const command = new ListScanJobsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Scan Jobs Result",
      description: "Result from ListScanJobs operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The next item following a partial list of returned items.",
          },
          ScanJobs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AccountId: {
                  type: "string",
                },
                BackupVaultArn: {
                  type: "string",
                },
                BackupVaultName: {
                  type: "string",
                },
                CompletionDate: {
                  type: "string",
                },
                CreatedBy: {
                  type: "object",
                  properties: {
                    BackupPlanArn: {
                      type: "string",
                    },
                    BackupPlanId: {
                      type: "string",
                    },
                    BackupPlanVersion: {
                      type: "string",
                    },
                    BackupRuleId: {
                      type: "string",
                    },
                  },
                  required: [
                    "BackupPlanArn",
                    "BackupPlanId",
                    "BackupPlanVersion",
                    "BackupRuleId",
                  ],
                  additionalProperties: false,
                },
                CreationDate: {
                  type: "string",
                },
                IamRoleArn: {
                  type: "string",
                },
                MalwareScanner: {
                  type: "string",
                },
                RecoveryPointArn: {
                  type: "string",
                },
                ResourceArn: {
                  type: "string",
                },
                ResourceName: {
                  type: "string",
                },
                ResourceType: {
                  type: "string",
                },
                ScanBaseRecoveryPointArn: {
                  type: "string",
                },
                ScanId: {
                  type: "string",
                },
                ScanJobId: {
                  type: "string",
                },
                ScanMode: {
                  type: "string",
                },
                ScanResult: {
                  type: "object",
                  properties: {
                    ScanResultStatus: {
                      type: "string",
                    },
                  },
                  required: ["ScanResultStatus"],
                  additionalProperties: false,
                },
                ScannerRoleArn: {
                  type: "string",
                },
                State: {
                  type: "string",
                },
                StatusMessage: {
                  type: "string",
                },
              },
              required: [
                "AccountId",
                "BackupVaultArn",
                "BackupVaultName",
                "CreatedBy",
                "CreationDate",
                "IamRoleArn",
                "MalwareScanner",
                "RecoveryPointArn",
                "ResourceArn",
                "ResourceName",
                "ResourceType",
                "ScanJobId",
                "ScanMode",
                "ScannerRoleArn",
              ],
              additionalProperties: false,
            },
            description:
              "An array of structures containing metadata about your scan jobs returned in JSON format.",
          },
        },
        required: ["ScanJobs"],
      },
    },
  },
};

export default listScanJobs;

import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, DescribeCopyJobCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeCopyJob: AppBlock = {
  name: "Describe Copy Job",
  description: `Returns metadata associated with creating a copy of a resource.`,
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
        CopyJobId: {
          name: "Copy Job Id",
          description: "Uniquely identifies a copy job.",
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

        const command = new DescribeCopyJobCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Copy Job Result",
      description: "Result from DescribeCopyJob operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CopyJob: {
            type: "object",
            properties: {
              AccountId: {
                type: "string",
              },
              CopyJobId: {
                type: "string",
              },
              SourceBackupVaultArn: {
                type: "string",
              },
              SourceRecoveryPointArn: {
                type: "string",
              },
              DestinationBackupVaultArn: {
                type: "string",
              },
              DestinationVaultType: {
                type: "string",
              },
              DestinationVaultLockState: {
                type: "string",
              },
              DestinationRecoveryPointArn: {
                type: "string",
              },
              DestinationEncryptionKeyArn: {
                type: "string",
              },
              DestinationRecoveryPointLifecycle: {
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
              CreatedByBackupJobId: {
                type: "string",
              },
              ResourceType: {
                type: "string",
              },
              ParentJobId: {
                type: "string",
              },
              IsParent: {
                type: "boolean",
              },
              CompositeMemberIdentifier: {
                type: "string",
              },
              NumberOfChildJobs: {
                type: "number",
              },
              ChildJobsInState: {
                type: "object",
                additionalProperties: {
                  type: "number",
                },
              },
              ResourceName: {
                type: "string",
              },
              MessageCategory: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Contains detailed information about a copy job.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeCopyJob;

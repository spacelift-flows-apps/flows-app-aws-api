import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  ListRestoreJobsByProtectedResourceCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const listRestoreJobsByProtectedResource: AppBlock = {
  name: "List Restore Jobs By Protected Resource",
  description: `This returns restore jobs that contain the specified protected resource.`,
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
        ResourceArn: {
          name: "Resource Arn",
          description:
            "Returns only restore jobs that match the specified resource Amazon Resource Name (ARN).",
          type: "string",
          required: true,
        },
        ByStatus: {
          name: "By Status",
          description:
            "Returns only restore jobs associated with the specified job status.",
          type: "string",
          required: false,
        },
        ByRecoveryPointCreationDateAfter: {
          name: "By Recovery Point Creation Date After",
          description:
            "Returns only restore jobs of recovery points that were created after the specified date.",
          type: "string",
          required: false,
        },
        ByRecoveryPointCreationDateBefore: {
          name: "By Recovery Point Creation Date Before",
          description:
            "Returns only restore jobs of recovery points that were created before the specified date.",
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

        const command = new ListRestoreJobsByProtectedResourceCommand(
          convertTimestamps(
            commandInput,
            new Set([
              "ByRecoveryPointCreationDateAfter",
              "ByRecoveryPointCreationDateBefore",
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
      name: "List Restore Jobs By Protected Resource Result",
      description: "Result from ListRestoreJobsByProtectedResource operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RestoreJobs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AccountId: {
                  type: "string",
                },
                RestoreJobId: {
                  type: "string",
                },
                RecoveryPointArn: {
                  type: "string",
                },
                SourceResourceArn: {
                  type: "string",
                },
                BackupVaultArn: {
                  type: "string",
                },
                CreationDate: {
                  type: "string",
                },
                CompletionDate: {
                  type: "string",
                },
                Status: {
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
                ExpectedCompletionTimeMinutes: {
                  type: "number",
                },
                CreatedResourceArn: {
                  type: "string",
                },
                ResourceType: {
                  type: "string",
                },
                RecoveryPointCreationDate: {
                  type: "string",
                },
                IsParent: {
                  type: "boolean",
                },
                ParentJobId: {
                  type: "string",
                },
                CreatedBy: {
                  type: "object",
                  properties: {
                    RestoreTestingPlanArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                ValidationStatus: {
                  type: "string",
                },
                ValidationStatusMessage: {
                  type: "string",
                },
                DeletionStatus: {
                  type: "string",
                },
                DeletionStatusMessage: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "An array of objects that contain detailed information about jobs to restore saved resources.",
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

export default listRestoreJobsByProtectedResource;

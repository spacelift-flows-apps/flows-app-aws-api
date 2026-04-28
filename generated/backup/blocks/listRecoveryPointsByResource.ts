import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  ListRecoveryPointsByResourceCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listRecoveryPointsByResource: AppBlock = {
  name: "List Recovery Points By Resource",
  description: `The information about the recovery points of the type specified by a resource Amazon Resource Name (ARN).`,
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
          description: "An ARN that uniquely identifies a resource.",
          type: "string",
          required: true,
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
        ManagedByAWSBackupOnly: {
          name: "Managed By AWS Backup Only",
          description:
            "This attribute filters recovery points based on ownership.",
          type: "boolean",
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

        const command = new ListRecoveryPointsByResourceCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Recovery Points By Resource Result",
      description: "Result from ListRecoveryPointsByResource operation",
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
                CreationDate: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                StatusMessage: {
                  type: "string",
                },
                EncryptionKeyArn: {
                  type: "string",
                },
                BackupSizeBytes: {
                  type: "number",
                },
                BackupVaultName: {
                  type: "string",
                },
                IsParent: {
                  type: "boolean",
                },
                ParentRecoveryPointArn: {
                  type: "string",
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
              "An array of objects that contain detailed information about recovery points of the specified resource type.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listRecoveryPointsByResource;

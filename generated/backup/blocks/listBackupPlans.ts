import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, ListBackupPlansCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listBackupPlans: AppBlock = {
  name: "List Backup Plans",
  description: `Lists the active backup plans for the account.`,
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
        IncludeDeleted: {
          name: "Include Deleted",
          description:
            "A Boolean value with a default value of FALSE that returns deleted backup plans when set to TRUE.",
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

        const command = new ListBackupPlansCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Backup Plans Result",
      description: "Result from ListBackupPlans operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The next item following a partial list of returned items.",
          },
          BackupPlansList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                BackupPlanArn: {
                  type: "string",
                },
                BackupPlanId: {
                  type: "string",
                },
                CreationDate: {
                  type: "string",
                },
                DeletionDate: {
                  type: "string",
                },
                VersionId: {
                  type: "string",
                },
                BackupPlanName: {
                  type: "string",
                },
                CreatorRequestId: {
                  type: "string",
                },
                LastExecutionDate: {
                  type: "string",
                },
                AdvancedBackupSettings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ResourceType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      BackupOptions: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description: "Information about the backup plans.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listBackupPlans;

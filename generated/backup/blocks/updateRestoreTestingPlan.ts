import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  UpdateRestoreTestingPlanCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateRestoreTestingPlan: AppBlock = {
  name: "Update Restore Testing Plan",
  description: `This request will send changes to your specified restore testing plan.`,
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
        RestoreTestingPlan: {
          name: "Restore Testing Plan",
          description: "Specifies the body of a restore testing plan.",
          type: {
            type: "object",
            properties: {
              RecoveryPointSelection: {
                type: "object",
                properties: {
                  Algorithm: {
                    type: "string",
                  },
                  ExcludeVaults: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  IncludeVaults: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  RecoveryPointTypes: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  SelectionWindowDays: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              ScheduleExpression: {
                type: "string",
              },
              ScheduleExpressionTimezone: {
                type: "string",
              },
              StartWindowHours: {
                type: "number",
              },
            },
            additionalProperties: false,
          },
          required: true,
        },
        RestoreTestingPlanName: {
          name: "Restore Testing Plan Name",
          description: "The name of the restore testing plan name.",
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

        const command = new UpdateRestoreTestingPlanCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Restore Testing Plan Result",
      description: "Result from UpdateRestoreTestingPlan operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CreationTime: {
            type: "string",
            description: "The time the resource testing plan was created.",
          },
          RestoreTestingPlanArn: {
            type: "string",
            description:
              "Unique ARN (Amazon Resource Name) of the restore testing plan.",
          },
          RestoreTestingPlanName: {
            type: "string",
            description: "The name cannot be changed after creation.",
          },
          UpdateTime: {
            type: "string",
            description:
              "The time the update completed for the restore testing plan.",
          },
        },
        required: [
          "CreationTime",
          "RestoreTestingPlanArn",
          "RestoreTestingPlanName",
          "UpdateTime",
        ],
      },
    },
  },
};

export default updateRestoreTestingPlan;

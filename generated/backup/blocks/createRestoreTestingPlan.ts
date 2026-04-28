import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  CreateRestoreTestingPlanCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createRestoreTestingPlan: AppBlock = {
  name: "Create Restore Testing Plan",
  description: `Creates a restore testing plan.`,
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
        CreatorRequestId: {
          name: "Creator Request Id",
          description:
            "This is a unique string that identifies the request and allows failed requests to be retriedwithout the risk of running the operation twice.",
          type: "string",
          required: false,
        },
        RestoreTestingPlan: {
          name: "Restore Testing Plan",
          description:
            "A restore testing plan must contain a unique RestoreTestingPlanName string you create and must contain a ScheduleExpression cron.",
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
              RestoreTestingPlanName: {
                type: "string",
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
            required: [
              "RecoveryPointSelection",
              "RestoreTestingPlanName",
              "ScheduleExpression",
            ],
            additionalProperties: false,
          },
          required: true,
        },
        Tags: {
          name: "Tags",
          description: "The tags to assign to the restore testing plan.",
          type: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
          },
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

        const command = new CreateRestoreTestingPlanCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Restore Testing Plan Result",
      description: "Result from CreateRestoreTestingPlan operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CreationTime: {
            type: "string",
            description:
              "The date and time a restore testing plan was created, in Unix format and Coordinated Universal Time (UTC).",
          },
          RestoreTestingPlanArn: {
            type: "string",
            description:
              "An Amazon Resource Name (ARN) that uniquely identifies the created restore testing plan.",
          },
          RestoreTestingPlanName: {
            type: "string",
            description:
              "This unique string is the name of the restore testing plan.",
          },
        },
        required: [
          "CreationTime",
          "RestoreTestingPlanArn",
          "RestoreTestingPlanName",
        ],
      },
    },
  },
};

export default createRestoreTestingPlan;

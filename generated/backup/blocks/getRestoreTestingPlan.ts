import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  GetRestoreTestingPlanCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getRestoreTestingPlan: AppBlock = {
  name: "Get Restore Testing Plan",
  description: `Returns RestoreTestingPlan details for the specified RestoreTestingPlanName.`,
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
        RestoreTestingPlanName: {
          name: "Restore Testing Plan Name",
          description: "Required unique name of the restore testing plan.",
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

        const command = new GetRestoreTestingPlanCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Restore Testing Plan Result",
      description: "Result from GetRestoreTestingPlan operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RestoreTestingPlan: {
            type: "object",
            properties: {
              CreationTime: {
                type: "string",
              },
              CreatorRequestId: {
                type: "string",
              },
              LastExecutionTime: {
                type: "string",
              },
              LastUpdateTime: {
                type: "string",
              },
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
              RestoreTestingPlanArn: {
                type: "string",
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
              "CreationTime",
              "RecoveryPointSelection",
              "RestoreTestingPlanArn",
              "RestoreTestingPlanName",
              "ScheduleExpression",
            ],
            additionalProperties: false,
            description: "Specifies the body of a restore testing plan.",
          },
        },
        required: ["RestoreTestingPlan"],
      },
    },
  },
};

export default getRestoreTestingPlan;

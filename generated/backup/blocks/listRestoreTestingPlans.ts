import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  ListRestoreTestingPlansCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listRestoreTestingPlans: AppBlock = {
  name: "List Restore Testing Plans",
  description: `Returns a list of restore testing plans.`,
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

        const command = new ListRestoreTestingPlansCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Restore Testing Plans Result",
      description: "Result from ListRestoreTestingPlans operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The next item following a partial list of returned items.",
          },
          RestoreTestingPlans: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CreationTime: {
                  type: "string",
                },
                LastExecutionTime: {
                  type: "string",
                },
                LastUpdateTime: {
                  type: "string",
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
                "RestoreTestingPlanArn",
                "RestoreTestingPlanName",
                "ScheduleExpression",
              ],
              additionalProperties: false,
            },
            description: "This is a returned list of restore testing plans.",
          },
        },
        required: ["RestoreTestingPlans"],
      },
    },
  },
};

export default listRestoreTestingPlans;

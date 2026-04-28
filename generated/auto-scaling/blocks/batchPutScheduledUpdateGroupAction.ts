import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  BatchPutScheduledUpdateGroupActionCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const batchPutScheduledUpdateGroupAction: AppBlock = {
  name: "Batch Put Scheduled Update Group Action",
  description: `Creates or updates one or more scheduled scaling actions for an Auto Scaling group.`,
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
        AutoScalingGroupName: {
          name: "Auto Scaling Group Name",
          description: "The name of the Auto Scaling group.",
          type: "string",
          required: true,
        },
        ScheduledUpdateGroupActions: {
          name: "Scheduled Update Group Actions",
          description: "One or more scheduled actions.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ScheduledActionName: {
                  type: "string",
                },
                StartTime: {
                  type: "string",
                },
                EndTime: {
                  type: "string",
                },
                Recurrence: {
                  type: "string",
                },
                MinSize: {
                  type: "number",
                },
                MaxSize: {
                  type: "number",
                },
                DesiredCapacity: {
                  type: "number",
                },
                TimeZone: {
                  type: "string",
                },
              },
              required: ["ScheduledActionName"],
              additionalProperties: false,
            },
          },
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

        const client = new AutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new BatchPutScheduledUpdateGroupActionCommand(
          convertTimestamps(
            commandInput,
            new Set(["StartTime", "EndTime"]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Batch Put Scheduled Update Group Action Result",
      description: "Result from BatchPutScheduledUpdateGroupAction operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          FailedScheduledUpdateGroupActions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ScheduledActionName: {
                  type: "string",
                },
                ErrorCode: {
                  type: "string",
                },
                ErrorMessage: {
                  type: "string",
                },
              },
              required: ["ScheduledActionName"],
              additionalProperties: false,
            },
            description:
              "The names of the scheduled actions that could not be created or updated, including an error message.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default batchPutScheduledUpdateGroupAction;

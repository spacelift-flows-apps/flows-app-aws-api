import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  DescribeScheduledActionsCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const describeScheduledActions: AppBlock = {
  name: "Describe Scheduled Actions",
  description: `Gets information about the scheduled actions that haven't run or that have not reached their end time.`,
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
          required: false,
        },
        ScheduledActionNames: {
          name: "Scheduled Action Names",
          description: "The names of one or more scheduled actions.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        StartTime: {
          name: "Start Time",
          description: "The earliest scheduled start time to return.",
          type: "string",
          required: false,
        },
        EndTime: {
          name: "End Time",
          description: "The latest scheduled start time to return.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description: "The maximum number of items to return with this call.",
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

        const client = new AutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeScheduledActionsCommand(
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
      name: "Describe Scheduled Actions Result",
      description: "Result from DescribeScheduledActions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ScheduledUpdateGroupActions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AutoScalingGroupName: {
                  type: "string",
                },
                ScheduledActionName: {
                  type: "string",
                },
                ScheduledActionARN: {
                  type: "string",
                },
                Time: {
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
              additionalProperties: false,
            },
            description: "The scheduled actions.",
          },
          NextToken: {
            type: "string",
            description:
              "A string that indicates that the response contains more items than can be returned in a single response.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeScheduledActions;

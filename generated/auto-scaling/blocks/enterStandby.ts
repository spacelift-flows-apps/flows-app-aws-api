import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  EnterStandbyCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const enterStandby: AppBlock = {
  name: "Enter Standby",
  description: `Moves the specified instances into the standby state.`,
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
        InstanceIds: {
          name: "Instance Ids",
          description: "The IDs of the instances.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AutoScalingGroupName: {
          name: "Auto Scaling Group Name",
          description: "The name of the Auto Scaling group.",
          type: "string",
          required: true,
        },
        ShouldDecrementDesiredCapacity: {
          name: "Should Decrement Desired Capacity",
          description:
            "Indicates whether to decrement the desired capacity of the Auto Scaling group by the number of instances moved to Standby mode.",
          type: "boolean",
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

        const command = new EnterStandbyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Enter Standby Result",
      description: "Result from EnterStandby operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Activities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ActivityId: {
                  type: "string",
                },
                AutoScalingGroupName: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                Cause: {
                  type: "string",
                },
                StartTime: {
                  type: "string",
                },
                EndTime: {
                  type: "string",
                },
                StatusCode: {
                  type: "string",
                },
                StatusMessage: {
                  type: "string",
                },
                Progress: {
                  type: "number",
                },
                Details: {
                  type: "string",
                },
                AutoScalingGroupState: {
                  type: "string",
                },
                AutoScalingGroupARN: {
                  type: "string",
                },
              },
              required: [
                "ActivityId",
                "AutoScalingGroupName",
                "Cause",
                "StartTime",
                "StatusCode",
              ],
              additionalProperties: false,
            },
            description:
              "The activities related to moving instances into Standby mode.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default enterStandby;

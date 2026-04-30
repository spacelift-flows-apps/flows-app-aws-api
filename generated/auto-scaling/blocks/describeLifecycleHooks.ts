import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  DescribeLifecycleHooksCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeLifecycleHooks: AppBlock = {
  name: "Describe Lifecycle Hooks",
  description: `Gets information about the lifecycle hooks for the specified Auto Scaling group.`,
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
        LifecycleHookNames: {
          name: "Lifecycle Hook Names",
          description: "The names of one or more lifecycle hooks.",
          type: {
            type: "array",
            items: {
              type: "string",
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

        const client = new AutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeLifecycleHooksCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Lifecycle Hooks Result",
      description: "Result from DescribeLifecycleHooks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          LifecycleHooks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                LifecycleHookName: {
                  type: "string",
                },
                AutoScalingGroupName: {
                  type: "string",
                },
                LifecycleTransition: {
                  type: "string",
                },
                NotificationTargetARN: {
                  type: "string",
                },
                RoleARN: {
                  type: "string",
                },
                NotificationMetadata: {
                  type: "string",
                },
                HeartbeatTimeout: {
                  type: "number",
                },
                GlobalTimeout: {
                  type: "number",
                },
                DefaultResult: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The lifecycle hooks for the specified group.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeLifecycleHooks;

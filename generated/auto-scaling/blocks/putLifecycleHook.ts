import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  PutLifecycleHookCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putLifecycleHook: AppBlock = {
  name: "Put Lifecycle Hook",
  description: `Creates or updates a lifecycle hook for the specified Auto Scaling group.`,
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
        LifecycleHookName: {
          name: "Lifecycle Hook Name",
          description: "The name of the lifecycle hook.",
          type: "string",
          required: true,
        },
        AutoScalingGroupName: {
          name: "Auto Scaling Group Name",
          description: "The name of the Auto Scaling group.",
          type: "string",
          required: true,
        },
        LifecycleTransition: {
          name: "Lifecycle Transition",
          description: "The lifecycle transition.",
          type: "string",
          required: false,
        },
        RoleARN: {
          name: "Role ARN",
          description:
            "The ARN of the IAM role that allows the Auto Scaling group to publish to the specified notification target.",
          type: "string",
          required: false,
        },
        NotificationTargetARN: {
          name: "Notification Target ARN",
          description:
            "The Amazon Resource Name (ARN) of the notification target that Amazon EC2 Auto Scaling uses to notify you when an instance is in a wait state for the lifecycle hook.",
          type: "string",
          required: false,
        },
        NotificationMetadata: {
          name: "Notification Metadata",
          description:
            "Additional information that you want to include any time Amazon EC2 Auto Scaling sends a message to the notification target.",
          type: "string",
          required: false,
        },
        HeartbeatTimeout: {
          name: "Heartbeat Timeout",
          description:
            "The maximum time, in seconds, that can elapse before the lifecycle hook times out.",
          type: "number",
          required: false,
        },
        DefaultResult: {
          name: "Default Result",
          description:
            "The action the Auto Scaling group takes when the lifecycle hook timeout elapses or if an unexpected failure occurs.",
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

        const client = new AutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutLifecycleHookCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Lifecycle Hook Result",
      description: "Result from PutLifecycleHook operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default putLifecycleHook;

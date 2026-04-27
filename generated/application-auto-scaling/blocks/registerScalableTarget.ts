import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ApplicationAutoScalingClient,
  RegisterScalableTargetCommand,
} from "@aws-sdk/client-application-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const registerScalableTarget: AppBlock = {
  name: "Register Scalable Target",
  description: `Registers or updates a scalable target, which is the resource that you want to scale.`,
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
        ServiceNamespace: {
          name: "Service Namespace",
          description:
            "The namespace of the Amazon Web Services service that provides the resource.",
          type: "string",
          required: true,
        },
        ResourceId: {
          name: "Resource Id",
          description:
            "The identifier of the resource that is associated with the scalable target.",
          type: "string",
          required: true,
        },
        ScalableDimension: {
          name: "Scalable Dimension",
          description:
            "The scalable dimension associated with the scalable target.",
          type: "string",
          required: true,
        },
        MinCapacity: {
          name: "Min Capacity",
          description: "The minimum value that you plan to scale in to.",
          type: "number",
          required: false,
        },
        MaxCapacity: {
          name: "Max Capacity",
          description: "The maximum value that you plan to scale out to.",
          type: "number",
          required: false,
        },
        RoleARN: {
          name: "Role ARN",
          description:
            "This parameter is required for services that do not support service-linked roles (such as Amazon EMR), and it must specify the ARN of an IAM role that allows Application Auto Scaling to modify the scalable target on your behalf.",
          type: "string",
          required: false,
        },
        SuspendedState: {
          name: "Suspended State",
          description:
            "An embedded object that contains attributes and attribute values that are used to suspend and resume automatic scaling.",
          type: {
            type: "object",
            properties: {
              DynamicScalingInSuspended: {
                type: "boolean",
              },
              DynamicScalingOutSuspended: {
                type: "boolean",
              },
              ScheduledScalingSuspended: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "Assigns one or more tags to the scalable target.",
          type: {
            type: "object",
            additionalProperties: {
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

        const client = new ApplicationAutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new RegisterScalableTargetCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Register Scalable Target Result",
      description: "Result from RegisterScalableTarget operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ScalableTargetARN: {
            type: "string",
            description: "The ARN of the scalable target.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default registerScalableTarget;

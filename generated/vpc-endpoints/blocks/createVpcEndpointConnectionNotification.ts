import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  CreateVpcEndpointConnectionNotificationCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createVpcEndpointConnectionNotification: AppBlock = {
  name: "Create Vpc Endpoint Connection Notification",
  description: `Creates a connection notification for a specified VPC endpoint or VPC endpoint service.`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        ServiceId: {
          name: "Service Id",
          description: "The ID of the endpoint service.",
          type: "string",
          required: false,
        },
        VpcEndpointId: {
          name: "Vpc Endpoint Id",
          description: "The ID of the endpoint.",
          type: "string",
          required: false,
        },
        ConnectionNotificationArn: {
          name: "Connection Notification Arn",
          description: "The ARN of the SNS topic for the notifications.",
          type: "string",
          required: true,
        },
        ConnectionEvents: {
          name: "Connection Events",
          description:
            "The endpoint events for which to receive notifications.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
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
            credentials: {
              accessKeyId: input.app.config.accessKeyId,
              secretAccessKey: input.app.config.secretAccessKey,
              sessionToken: input.app.config.sessionToken,
            },
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateVpcEndpointConnectionNotificationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Vpc Endpoint Connection Notification Result",
      description:
        "Result from CreateVpcEndpointConnectionNotification operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ConnectionNotification: {
            type: "object",
            properties: {
              ConnectionNotificationId: {
                type: "string",
              },
              ServiceId: {
                type: "string",
              },
              VpcEndpointId: {
                type: "string",
              },
              ConnectionNotificationType: {
                type: "string",
              },
              ConnectionNotificationArn: {
                type: "string",
              },
              ConnectionEvents: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              ConnectionNotificationState: {
                type: "string",
              },
              ServiceRegion: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the notification.",
          },
          ClientToken: {
            type: "string",
            description:
              "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createVpcEndpointConnectionNotification;

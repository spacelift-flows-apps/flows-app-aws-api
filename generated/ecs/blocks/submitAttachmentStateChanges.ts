import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECSClient,
  SubmitAttachmentStateChangesCommand,
} from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const submitAttachmentStateChanges: AppBlock = {
  name: "Submit Attachment State Changes",
  description: `This action is only used by the Amazon ECS agent, and it is not intended for use outside of the agent.`,
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
        cluster: {
          name: "cluster",
          description:
            "The short name or full ARN of the cluster that hosts the container instance the attachment belongs to.",
          type: "string",
          required: false,
        },
        attachments: {
          name: "attachments",
          description:
            "Any attachments associated with the state change request.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                attachmentArn: {
                  type: "string",
                },
                status: {
                  type: "string",
                },
              },
              required: ["attachmentArn", "status"],
              additionalProperties: false,
            },
          },
          required: true,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new SubmitAttachmentStateChangesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Submit Attachment State Changes Result",
      description: "Result from SubmitAttachmentStateChanges operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          acknowledgment: {
            type: "string",
            description: "Acknowledgement of the state change.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default submitAttachmentStateChanges;

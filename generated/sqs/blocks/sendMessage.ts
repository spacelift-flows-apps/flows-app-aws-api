import { AppBlock, events } from "@slflows/sdk/v1";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const sendMessage: AppBlock = {
  name: "Send Message",
  description: `Delivers a message to the specified queue.`,
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
        QueueUrl: {
          name: "Queue Url",
          description:
            "The URL of the Amazon SQS queue to which a message is sent.",
          type: "string",
          required: true,
        },
        MessageBody: {
          name: "Message Body",
          description: "The message to send.",
          type: "string",
          required: true,
        },
        DelaySeconds: {
          name: "Delay Seconds",
          description:
            "The length of time, in seconds, for which to delay a specific message.",
          type: "number",
          required: false,
        },
        MessageAttributes: {
          name: "Message Attributes",
          description:
            "Each message attribute consists of a Name, Type, and Value.",
          type: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
          },
          required: false,
        },
        MessageSystemAttributes: {
          name: "Message System Attributes",
          description: "The message system attribute to send.",
          type: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
          },
          required: false,
        },
        MessageDeduplicationId: {
          name: "Message Deduplication Id",
          description:
            "This parameter applies only to FIFO (first-in-first-out) queues.",
          type: "string",
          required: false,
        },
        MessageGroupId: {
          name: "Message Group Id",
          description:
            "MessageGroupId is an attribute used in Amazon SQS FIFO (First-In-First-Out) and standard queues.",
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

        const client = new SQSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new SendMessageCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Send Message Result",
      description: "Result from SendMessage operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          MD5OfMessageBody: {
            type: "string",
            description:
              "An MD5 digest of the non-URL-encoded message body string.",
          },
          MD5OfMessageAttributes: {
            type: "string",
            description:
              "An MD5 digest of the non-URL-encoded message attribute string.",
          },
          MD5OfMessageSystemAttributes: {
            type: "string",
            description:
              "An MD5 digest of the non-URL-encoded message system attribute string.",
          },
          MessageId: {
            type: "string",
            description:
              "An attribute containing the MessageId of the message sent to the queue.",
          },
          SequenceNumber: {
            type: "string",
            description:
              "This parameter applies only to FIFO (first-in-first-out) queues.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default sendMessage;

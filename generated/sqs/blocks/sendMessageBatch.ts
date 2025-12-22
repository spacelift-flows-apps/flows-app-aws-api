import { AppBlock, events } from "@slflows/sdk/v1";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const sendMessageBatch: AppBlock = {
  name: "Send Message Batch",
  description: `You can use SendMessageBatch to send up to 10 messages to the specified queue by assigning either identical or different values to each message (or by not assigning values at all).`,
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
            "The URL of the Amazon SQS queue to which batched messages are sent.",
          type: "string",
          required: true,
        },
        Entries: {
          name: "Entries",
          description: "A list of SendMessageBatchRequestEntry items.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                MessageBody: {
                  type: "string",
                },
                DelaySeconds: {
                  type: "number",
                },
                MessageAttributes: {
                  type: "object",
                  additionalProperties: {
                    type: "object",
                  },
                },
                MessageSystemAttributes: {
                  type: "object",
                  additionalProperties: {
                    type: "object",
                  },
                },
                MessageDeduplicationId: {
                  type: "string",
                },
                MessageGroupId: {
                  type: "string",
                },
              },
              required: ["Id", "MessageBody"],
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

        const client = new SQSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new SendMessageBatchCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Send Message Batch Result",
      description: "Result from SendMessageBatch operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Successful: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                MessageId: {
                  type: "string",
                },
                MD5OfMessageBody: {
                  type: "string",
                },
                MD5OfMessageAttributes: {
                  type: "string",
                },
                MD5OfMessageSystemAttributes: {
                  type: "string",
                },
                SequenceNumber: {
                  type: "string",
                },
              },
              required: ["Id", "MessageId", "MD5OfMessageBody"],
              additionalProperties: false,
            },
            description: "A list of SendMessageBatchResultEntry items.",
          },
          Failed: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                SenderFault: {
                  type: "boolean",
                },
                Code: {
                  type: "string",
                },
                Message: {
                  type: "string",
                },
              },
              required: ["Id", "SenderFault", "Code"],
              additionalProperties: false,
            },
            description:
              "A list of BatchResultErrorEntry items with error details about each message that can't be enqueued.",
          },
        },
        required: ["Successful", "Failed"],
      },
    },
  },
};

export default sendMessageBatch;

import { AppBlock, events } from "@slflows/sdk/v1";
import { SNSClient, PublishBatchCommand } from "@aws-sdk/client-sns";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const publishBatch: AppBlock = {
  name: "Publish Batch",
  description: `Publishes up to ten messages to the specified topic.`,
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
        TopicArn: {
          name: "Topic Arn",
          description:
            "The Amazon resource name (ARN) of the topic you want to batch publish to.",
          type: "string",
          required: true,
        },
        PublishBatchRequestEntries: {
          name: "Publish Batch Request Entries",
          description:
            "A list of PublishBatch request entries to be sent to the SNS topic.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                Message: {
                  type: "string",
                },
                Subject: {
                  type: "string",
                },
                MessageStructure: {
                  type: "string",
                },
                MessageAttributes: {
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
              required: ["Id", "Message"],
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

        const client = new SNSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PublishBatchCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Publish Batch Result",
      description: "Result from PublishBatch operation",
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
                SequenceNumber: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of successful PublishBatch responses.",
          },
          Failed: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                Code: {
                  type: "string",
                },
                Message: {
                  type: "string",
                },
                SenderFault: {
                  type: "boolean",
                },
              },
              required: ["Id", "Code", "SenderFault"],
              additionalProperties: false,
            },
            description: "A list of failed PublishBatch responses.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default publishBatch;

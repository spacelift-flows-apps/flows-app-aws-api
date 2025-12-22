import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SQSClient,
  ChangeMessageVisibilityBatchCommand,
} from "@aws-sdk/client-sqs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const changeMessageVisibilityBatch: AppBlock = {
  name: "Change Message Visibility Batch",
  description: `Changes the visibility timeout of multiple messages.`,
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
            "The URL of the Amazon SQS queue whose messages' visibility is changed.",
          type: "string",
          required: true,
        },
        Entries: {
          name: "Entries",
          description:
            "Lists the receipt handles of the messages for which the visibility timeout must be changed.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                ReceiptHandle: {
                  type: "string",
                },
                VisibilityTimeout: {
                  type: "number",
                },
              },
              required: ["Id", "ReceiptHandle"],
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

        const command = new ChangeMessageVisibilityBatchCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Change Message Visibility Batch Result",
      description: "Result from ChangeMessageVisibilityBatch operation",
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
              },
              required: ["Id"],
              additionalProperties: false,
            },
            description:
              "A list of ChangeMessageVisibilityBatchResultEntry items.",
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
            description: "A list of BatchResultErrorEntry items.",
          },
        },
        required: ["Successful", "Failed"],
      },
    },
  },
};

export default changeMessageVisibilityBatch;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  S3Client,
  GetBucketNotificationConfigurationCommand,
} from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const getBucketNotificationConfiguration: AppBlock = {
  name: "Get Bucket Notification Configuration",
  description: `This operation is not supported for directory buckets.`,
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
        Bucket: {
          name: "Bucket",
          description:
            "The name of the bucket for which to get the notification configuration.",
          type: "string",
          required: true,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
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

        const client = new S3Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetBucketNotificationConfigurationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Bucket Notification Configuration Result",
      description: "Result from GetBucketNotificationConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TopicConfigurations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                TopicArn: {
                  type: "string",
                },
                Events: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                Filter: {
                  type: "object",
                  properties: {
                    Key: {
                      type: "object",
                      properties: {
                        FilterRules: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["TopicArn", "Events"],
              additionalProperties: false,
            },
            description:
              "The topic to which notifications are sent and the events for which notifications are generated.",
          },
          QueueConfigurations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                QueueArn: {
                  type: "string",
                },
                Events: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                Filter: {
                  type: "object",
                  properties: {
                    Key: {
                      type: "object",
                      properties: {
                        FilterRules: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["QueueArn", "Events"],
              additionalProperties: false,
            },
            description:
              "The Amazon Simple Queue Service queues to publish messages to and the events for which to publish messages.",
          },
          LambdaFunctionConfigurations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                LambdaFunctionArn: {
                  type: "string",
                },
                Events: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                Filter: {
                  type: "object",
                  properties: {
                    Key: {
                      type: "object",
                      properties: {
                        FilterRules: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["LambdaFunctionArn", "Events"],
              additionalProperties: false,
            },
            description:
              "Describes the Lambda functions to invoke and the events for which to invoke them.",
          },
          EventBridgeConfiguration: {
            type: "object",
            properties: {},
            additionalProperties: false,
            description: "Enables delivery of events to Amazon EventBridge.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getBucketNotificationConfiguration;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const invokeModelWithBidirectionalStream: AppBlock = {
  name: "Invoke Model With Bidirectional Stream",
  description: `Invoke the specified Amazon Bedrock model to run inference using the bidirectional stream.`,
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
        modelId: {
          name: "model Id",
          description: "The model ID or ARN of the model ID to use.",
          type: "string",
          required: true,
        },
        body: {
          name: "body",
          description:
            "The prompt and inference parameters in the format specified in the BidirectionalInputPayloadPart in the header.",
          type: {
            oneOf: [
              {
                type: "object",
                properties: {
                  chunk: {
                    type: "object",
                    properties: {
                      bytes: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                required: ["chunk"],
                additionalProperties: false,
              },
            ],
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

        const client = new BedrockRuntimeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new InvokeModelWithBidirectionalStreamCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Invoke Model With Bidirectional Stream Result",
      description: "Result from InvokeModelWithBidirectionalStream operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          body: {
            oneOf: [
              {
                type: "object",
                properties: {
                  chunk: {
                    type: "object",
                    properties: {
                      bytes: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                required: ["chunk"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  internalServerException: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                required: ["internalServerException"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  modelStreamErrorException: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                      },
                      originalStatusCode: {
                        type: "number",
                      },
                      originalMessage: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                required: ["modelStreamErrorException"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  validationException: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                required: ["validationException"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  throttlingException: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                required: ["throttlingException"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  modelTimeoutException: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                required: ["modelTimeoutException"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  serviceUnavailableException: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                required: ["serviceUnavailableException"],
                additionalProperties: false,
              },
            ],
            description:
              "Streaming response from the model in the format specified by the BidirectionalOutputPayloadPart header.",
          },
        },
        required: ["body"],
      },
    },
  },
};

export default invokeModelWithBidirectionalStream;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const converseStream: AppBlock = {
  name: "Converse Stream",
  description: `Sends messages to the specified Amazon Bedrock model and returns the response in a stream.`,
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
          description:
            "Specifies the model or throughput with which to run inference, or the prompt resource to use in inference.",
          type: "string",
          required: true,
        },
        messages: {
          name: "messages",
          description: "The messages that you want to send to the model.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                role: {
                  type: "string",
                },
                content: {
                  type: "array",
                  items: {
                    oneOf: [
                      {
                        type: "object",
                        properties: {
                          text: {
                            type: "string",
                          },
                        },
                        required: ["text"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          image: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["image"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          document: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["document"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          video: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["video"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          audio: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["audio"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          toolUse: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["toolUse"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          toolResult: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["toolResult"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          guardContent: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["guardContent"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          cachePoint: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["cachePoint"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          reasoningContent: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["reasoningContent"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          citationsContent: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["citationsContent"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          searchResult: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["searchResult"],
                        additionalProperties: false,
                      },
                    ],
                  },
                },
              },
              required: ["role", "content"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        system: {
          name: "system",
          description:
            "A prompt that provides instructions or context to the model about the task it should perform, or the persona it should adopt during the conversation.",
          type: {
            type: "array",
            items: {
              oneOf: [
                {
                  type: "object",
                  properties: {
                    text: {
                      type: "string",
                    },
                  },
                  required: ["text"],
                  additionalProperties: false,
                },
                {
                  type: "object",
                  properties: {
                    guardContent: {
                      oneOf: [
                        {
                          type: "object",
                          properties: {
                            text: {
                              type: "object",
                              properties: {
                                text: {
                                  type: "string",
                                },
                                qualifiers: {
                                  type: "object",
                                  additionalProperties: true,
                                },
                              },
                              required: ["text"],
                              additionalProperties: false,
                            },
                          },
                          required: ["text"],
                          additionalProperties: false,
                        },
                        {
                          type: "object",
                          properties: {
                            image: {
                              type: "object",
                              properties: {
                                format: {
                                  type: "object",
                                  additionalProperties: true,
                                },
                                source: {
                                  type: "object",
                                  additionalProperties: true,
                                },
                              },
                              required: ["format", "source"],
                              additionalProperties: false,
                            },
                          },
                          required: ["image"],
                          additionalProperties: false,
                        },
                      ],
                    },
                  },
                  required: ["guardContent"],
                  additionalProperties: false,
                },
                {
                  type: "object",
                  properties: {
                    cachePoint: {
                      type: "object",
                      properties: {
                        type: {
                          type: "string",
                        },
                        ttl: {
                          type: "string",
                        },
                      },
                      required: ["type"],
                      additionalProperties: false,
                    },
                  },
                  required: ["cachePoint"],
                  additionalProperties: false,
                },
              ],
            },
          },
          required: false,
        },
        inferenceConfig: {
          name: "inference Config",
          description: "Inference parameters to pass to the model.",
          type: {
            type: "object",
            properties: {
              maxTokens: {
                type: "string",
              },
              temperature: {
                type: "string",
              },
              topP: {
                type: "string",
              },
              stopSequences: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        toolConfig: {
          name: "tool Config",
          description:
            "Configuration information for the tools that the model can use when generating a response.",
          type: {
            type: "object",
            properties: {
              tools: {
                type: "array",
                items: {
                  oneOf: [
                    {
                      type: "object",
                      properties: {
                        toolSpec: {
                          type: "object",
                          properties: {
                            name: {
                              type: "object",
                              additionalProperties: true,
                            },
                            description: {
                              type: "object",
                              additionalProperties: true,
                            },
                            inputSchema: {
                              type: "object",
                              additionalProperties: true,
                            },
                            strict: {
                              type: "string",
                            },
                          },
                          required: ["name", "inputSchema"],
                          additionalProperties: false,
                        },
                      },
                      required: ["toolSpec"],
                      additionalProperties: false,
                    },
                    {
                      type: "object",
                      properties: {
                        systemTool: {
                          type: "object",
                          properties: {
                            name: {
                              type: "object",
                              additionalProperties: true,
                            },
                          },
                          required: ["name"],
                          additionalProperties: false,
                        },
                      },
                      required: ["systemTool"],
                      additionalProperties: false,
                    },
                    {
                      type: "object",
                      properties: {
                        cachePoint: {
                          type: "object",
                          properties: {
                            type: {
                              type: "object",
                              additionalProperties: true,
                            },
                            ttl: {
                              type: "object",
                              additionalProperties: true,
                            },
                          },
                          required: ["type"],
                          additionalProperties: false,
                        },
                      },
                      required: ["cachePoint"],
                      additionalProperties: false,
                    },
                  ],
                },
              },
              toolChoice: {
                oneOf: [
                  {
                    type: "object",
                    properties: {
                      auto: {
                        type: "object",
                        properties: {},
                        additionalProperties: false,
                      },
                    },
                    required: ["auto"],
                    additionalProperties: false,
                  },
                  {
                    type: "object",
                    properties: {
                      any: {
                        type: "object",
                        properties: {},
                        additionalProperties: false,
                      },
                    },
                    required: ["any"],
                    additionalProperties: false,
                  },
                  {
                    type: "object",
                    properties: {
                      tool: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                          },
                        },
                        required: ["name"],
                        additionalProperties: false,
                      },
                    },
                    required: ["tool"],
                    additionalProperties: false,
                  },
                ],
              },
            },
            required: ["tools"],
            additionalProperties: false,
          },
          required: false,
        },
        guardrailConfig: {
          name: "guardrail Config",
          description:
            "Configuration information for a guardrail that you want to use in the request.",
          type: {
            type: "object",
            properties: {
              guardrailIdentifier: {
                type: "string",
              },
              guardrailVersion: {
                type: "string",
              },
              trace: {
                type: "string",
              },
              streamProcessingMode: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        additionalModelRequestFields: {
          name: "additional Model Request Fields",
          description:
            "Additional inference parameters that the model supports, beyond the base set of inference parameters that Converse and ConverseStream support in the inferenceConfig field.",
          type: "string",
          required: false,
        },
        promptVariables: {
          name: "prompt Variables",
          description:
            "Contains a map of variables in a prompt from Prompt management to objects containing the values to fill in for them when running model invocation.",
          type: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
          },
          required: false,
        },
        additionalModelResponseFieldPaths: {
          name: "additional Model Response Field Paths",
          description:
            "Additional model parameters field paths to return in the response.",
          type: {
            type: "array",
            items: {},
          },
          required: false,
        },
        requestMetadata: {
          name: "request Metadata",
          description:
            "Key-value pairs that you can use to filter invocation logs.",
          type: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
          },
          required: false,
        },
        performanceConfig: {
          name: "performance Config",
          description: "Model performance settings for the request.",
          type: {
            type: "object",
            properties: {
              latency: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        serviceTier: {
          name: "service Tier",
          description:
            "Specifies the processing tier configuration used for serving the request.",
          type: {
            type: "object",
            properties: {
              type: {
                type: "string",
              },
            },
            required: ["type"],
            additionalProperties: false,
          },
          required: false,
        },
        outputConfig: {
          name: "output Config",
          description: "Output configuration for a model response.",
          type: {
            type: "object",
            properties: {
              textFormat: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                  },
                  structure: {
                    oneOf: [
                      {
                        type: "object",
                        properties: {
                          jsonSchema: {
                            type: "object",
                            properties: {
                              schema: {
                                type: "string",
                              },
                              name: {
                                type: "string",
                              },
                              description: {
                                type: "string",
                              },
                            },
                            required: ["schema"],
                            additionalProperties: false,
                          },
                        },
                        required: ["jsonSchema"],
                        additionalProperties: false,
                      },
                    ],
                  },
                },
                required: ["type", "structure"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
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

        const client = new BedrockRuntimeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ConverseStreamCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Converse Stream Result",
      description: "Result from ConverseStream operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          stream: {
            oneOf: [
              {
                type: "object",
                properties: {
                  messageStart: {
                    type: "object",
                    properties: {
                      role: {
                        type: "string",
                      },
                    },
                    required: ["role"],
                    additionalProperties: false,
                  },
                },
                required: ["messageStart"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  contentBlockStart: {
                    type: "object",
                    properties: {
                      start: {
                        oneOf: [
                          {
                            type: "object",
                            properties: {
                              toolUse: {
                                type: "object",
                                properties: {
                                  toolUseId: {
                                    type: "object",
                                    additionalProperties: true,
                                  },
                                  name: {
                                    type: "object",
                                    additionalProperties: true,
                                  },
                                  type: {
                                    type: "object",
                                    additionalProperties: true,
                                  },
                                },
                                required: ["toolUseId", "name"],
                                additionalProperties: false,
                              },
                            },
                            required: ["toolUse"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              toolResult: {
                                type: "object",
                                properties: {
                                  toolUseId: {
                                    type: "object",
                                    additionalProperties: true,
                                  },
                                  type: {
                                    type: "string",
                                  },
                                  status: {
                                    type: "object",
                                    additionalProperties: true,
                                  },
                                },
                                required: ["toolUseId"],
                                additionalProperties: false,
                              },
                            },
                            required: ["toolResult"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              image: {
                                type: "object",
                                properties: {
                                  format: {
                                    type: "object",
                                    additionalProperties: true,
                                  },
                                },
                                required: ["format"],
                                additionalProperties: false,
                              },
                            },
                            required: ["image"],
                            additionalProperties: false,
                          },
                        ],
                      },
                      contentBlockIndex: {
                        type: "number",
                      },
                    },
                    required: ["start", "contentBlockIndex"],
                    additionalProperties: false,
                  },
                },
                required: ["contentBlockStart"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  contentBlockDelta: {
                    type: "object",
                    properties: {
                      delta: {
                        oneOf: [
                          {
                            type: "object",
                            properties: {
                              text: {
                                type: "string",
                              },
                            },
                            required: ["text"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              toolUse: {
                                type: "object",
                                properties: {
                                  input: {
                                    type: "string",
                                  },
                                },
                                required: ["input"],
                                additionalProperties: false,
                              },
                            },
                            required: ["toolUse"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              toolResult: {
                                type: "array",
                                items: {
                                  type: "object",
                                  additionalProperties: true,
                                },
                              },
                            },
                            required: ["toolResult"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              reasoningContent: {
                                oneOf: [
                                  {
                                    type: "object",
                                    properties: {
                                      text: {
                                        type: "string",
                                      },
                                    },
                                    required: ["text"],
                                    additionalProperties: false,
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      redactedContent: {
                                        type: "string",
                                      },
                                    },
                                    required: ["redactedContent"],
                                    additionalProperties: false,
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      signature: {
                                        type: "string",
                                      },
                                    },
                                    required: ["signature"],
                                    additionalProperties: false,
                                  },
                                ],
                              },
                            },
                            required: ["reasoningContent"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              citation: {
                                type: "object",
                                properties: {
                                  title: {
                                    type: "string",
                                  },
                                  source: {
                                    type: "string",
                                  },
                                  sourceContent: {
                                    type: "object",
                                    additionalProperties: true,
                                  },
                                  location: {
                                    type: "object",
                                    additionalProperties: true,
                                  },
                                },
                                additionalProperties: false,
                              },
                            },
                            required: ["citation"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              image: {
                                type: "object",
                                properties: {
                                  source: {
                                    type: "object",
                                    additionalProperties: true,
                                  },
                                  error: {
                                    type: "object",
                                    additionalProperties: true,
                                  },
                                },
                                additionalProperties: false,
                              },
                            },
                            required: ["image"],
                            additionalProperties: false,
                          },
                        ],
                      },
                      contentBlockIndex: {
                        type: "number",
                      },
                    },
                    required: ["delta", "contentBlockIndex"],
                    additionalProperties: false,
                  },
                },
                required: ["contentBlockDelta"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  contentBlockStop: {
                    type: "object",
                    properties: {
                      contentBlockIndex: {
                        type: "number",
                      },
                    },
                    required: ["contentBlockIndex"],
                    additionalProperties: false,
                  },
                },
                required: ["contentBlockStop"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  messageStop: {
                    type: "object",
                    properties: {
                      stopReason: {
                        type: "string",
                      },
                      additionalModelResponseFields: {
                        type: "string",
                      },
                    },
                    required: ["stopReason"],
                    additionalProperties: false,
                  },
                },
                required: ["messageStop"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  metadata: {
                    type: "object",
                    properties: {
                      usage: {
                        type: "object",
                        properties: {
                          inputTokens: {
                            type: "string",
                          },
                          outputTokens: {
                            type: "string",
                          },
                          totalTokens: {
                            type: "string",
                          },
                          cacheReadInputTokens: {
                            type: "string",
                          },
                          cacheWriteInputTokens: {
                            type: "string",
                          },
                          cacheDetails: {
                            type: "array",
                            items: {
                              type: "object",
                              additionalProperties: true,
                            },
                          },
                        },
                        required: [
                          "inputTokens",
                          "outputTokens",
                          "totalTokens",
                        ],
                        additionalProperties: false,
                      },
                      metrics: {
                        type: "object",
                        properties: {
                          latencyMs: {
                            type: "string",
                          },
                        },
                        required: ["latencyMs"],
                        additionalProperties: false,
                      },
                      trace: {
                        type: "object",
                        properties: {
                          guardrail: {
                            type: "object",
                            properties: {
                              modelOutput: {
                                type: "object",
                                additionalProperties: true,
                              },
                              inputAssessment: {
                                type: "object",
                                additionalProperties: true,
                              },
                              outputAssessments: {
                                type: "object",
                                additionalProperties: true,
                              },
                              actionReason: {
                                type: "string",
                              },
                            },
                            additionalProperties: false,
                          },
                          promptRouter: {
                            type: "object",
                            properties: {
                              invokedModelId: {
                                type: "object",
                                additionalProperties: true,
                              },
                            },
                            additionalProperties: false,
                          },
                        },
                        additionalProperties: false,
                      },
                      performanceConfig: {
                        type: "object",
                        properties: {
                          latency: {
                            type: "string",
                          },
                        },
                        additionalProperties: false,
                      },
                      serviceTier: {
                        type: "object",
                        properties: {
                          type: {
                            type: "string",
                          },
                        },
                        required: ["type"],
                        additionalProperties: false,
                      },
                    },
                    required: ["usage", "metrics"],
                    additionalProperties: false,
                  },
                },
                required: ["metadata"],
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
            description: "The output stream that the model generated.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default converseStream;

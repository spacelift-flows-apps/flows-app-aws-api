import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BedrockRuntimeClient,
  CountTokensCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const countTokens: AppBlock = {
  name: "Count Tokens",
  description: `Returns the token count for a given inference request.`,
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
            "The unique identifier or ARN of the foundation model to use for token counting.",
          type: "string",
          required: true,
        },
        input: {
          name: "input",
          description: "The input for which to count tokens.",
          type: {
            oneOf: [
              {
                type: "object",
                properties: {
                  invokeModel: {
                    type: "object",
                    properties: {
                      body: {
                        type: "string",
                      },
                    },
                    required: ["body"],
                    additionalProperties: false,
                  },
                },
                required: ["invokeModel"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  converse: {
                    type: "object",
                    properties: {
                      messages: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            role: {
                              type: "string",
                            },
                            content: {
                              type: "array",
                              items: {},
                            },
                          },
                          required: ["role", "content"],
                          additionalProperties: false,
                        },
                      },
                      system: {
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
                                        text: {},
                                      },
                                      required: ["text"],
                                      additionalProperties: false,
                                    },
                                    {
                                      type: "object",
                                      properties: {
                                        image: {},
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
                                    type: {},
                                    ttl: {},
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
                      toolConfig: {
                        type: "object",
                        properties: {
                          tools: {
                            type: "array",
                            items: {
                              oneOf: [
                                {
                                  type: "object",
                                  properties: {
                                    toolSpec: {},
                                  },
                                  required: ["toolSpec"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    systemTool: {},
                                  },
                                  required: ["systemTool"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    cachePoint: {},
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
                                      name: {},
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
                      additionalModelRequestFields: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                required: ["converse"],
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

        const command = new CountTokensCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Count Tokens Result",
      description: "Result from CountTokens operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          inputTokens: {
            type: "string",
            description:
              "The number of tokens in the provided input according to the specified model's tokenization rules.",
          },
        },
        required: ["inputTokens"],
      },
    },
  },
};

export default countTokens;

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
                    type: "string",
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
              type: "string",
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
                  type: "string",
                },
              },
              toolChoice: {
                type: "string",
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
              type: "string",
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
            items: {
              type: "any",
            },
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
                    type: "string",
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
            type: "string",
            description: "The output stream that the model generated.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default converseStream;

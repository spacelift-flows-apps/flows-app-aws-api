import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BedrockRuntimeClient,
  ApplyGuardrailCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const applyGuardrail: AppBlock = {
  name: "Apply Guardrail",
  description: `The action to apply a guardrail.`,
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
        guardrailIdentifier: {
          name: "guardrail Identifier",
          description:
            "The guardrail identifier used in the request to apply the guardrail.",
          type: "string",
          required: true,
        },
        guardrailVersion: {
          name: "guardrail Version",
          description:
            "The guardrail version used in the request to apply the guardrail.",
          type: "string",
          required: true,
        },
        source: {
          name: "source",
          description:
            "The source of data used in the request to apply the guardrail.",
          type: {
            type: "string",
            enum: ["INPUT", "OUTPUT"],
          },
          required: true,
        },
        content: {
          name: "content",
          description:
            "The content details used in the request to apply the guardrail.",
          type: {
            type: "array",
            items: {
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
                          type: "array",
                          items: {
                            type: "string",
                            enum: [
                              "grounding_source",
                              "query",
                              "guard_content",
                            ],
                          },
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
                          type: "string",
                          enum: ["png", "jpeg"],
                        },
                        source: {
                          oneOf: [
                            {
                              type: "object",
                              properties: {
                                bytes: {
                                  type: "string",
                                },
                              },
                              required: ["bytes"],
                              additionalProperties: false,
                            },
                          ],
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
          required: true,
        },
        outputScope: {
          name: "output Scope",
          description:
            "Specifies the scope of the output that you get in the response.",
          type: {
            type: "string",
            enum: ["INTERVENTIONS", "FULL"],
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

        const command = new ApplyGuardrailCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Apply Guardrail Result",
      description: "Result from ApplyGuardrail operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          usage: {
            type: "object",
            properties: {
              topicPolicyUnits: {
                type: "number",
              },
              contentPolicyUnits: {
                type: "number",
              },
              wordPolicyUnits: {
                type: "number",
              },
              sensitiveInformationPolicyUnits: {
                type: "number",
              },
              sensitiveInformationPolicyFreeUnits: {
                type: "number",
              },
              contextualGroundingPolicyUnits: {
                type: "number",
              },
              contentPolicyImageUnits: {
                type: "number",
              },
              automatedReasoningPolicyUnits: {
                type: "number",
              },
              automatedReasoningPolicies: {
                type: "number",
              },
            },
            required: [
              "topicPolicyUnits",
              "contentPolicyUnits",
              "wordPolicyUnits",
              "sensitiveInformationPolicyUnits",
              "sensitiveInformationPolicyFreeUnits",
              "contextualGroundingPolicyUnits",
            ],
            additionalProperties: false,
            description:
              "The usage details in the response from the guardrail.",
          },
          action: {
            type: "string",
            enum: ["NONE", "GUARDRAIL_INTERVENED"],
            description: "The action taken in the response from the guardrail.",
          },
          actionReason: {
            type: "string",
            description:
              "The reason for the action taken when harmful content is detected.",
          },
          outputs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "The output details in the response from the guardrail.",
          },
          assessments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topicPolicy: {
                  type: "object",
                  properties: {
                    topics: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                          },
                          type: {},
                          action: {},
                          detected: {
                            type: "string",
                          },
                        },
                        required: ["name", "type", "action"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["topics"],
                  additionalProperties: false,
                },
                contentPolicy: {
                  type: "object",
                  properties: {
                    filters: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: {},
                          confidence: {},
                          filterStrength: {},
                          action: {},
                          detected: {
                            type: "string",
                          },
                        },
                        required: ["type", "confidence", "action"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["filters"],
                  additionalProperties: false,
                },
                wordPolicy: {
                  type: "object",
                  properties: {
                    customWords: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          match: {
                            type: "string",
                          },
                          action: {},
                          detected: {
                            type: "string",
                          },
                        },
                        required: ["match", "action"],
                        additionalProperties: false,
                      },
                    },
                    managedWordLists: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          match: {
                            type: "string",
                          },
                          type: {},
                          action: {},
                          detected: {
                            type: "string",
                          },
                        },
                        required: ["match", "type", "action"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["customWords", "managedWordLists"],
                  additionalProperties: false,
                },
                sensitiveInformationPolicy: {
                  type: "object",
                  properties: {
                    piiEntities: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          match: {
                            type: "string",
                          },
                          type: {},
                          action: {},
                          detected: {
                            type: "string",
                          },
                        },
                        required: ["match", "type", "action"],
                        additionalProperties: false,
                      },
                    },
                    regexes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                          },
                          match: {
                            type: "string",
                          },
                          regex: {
                            type: "string",
                          },
                          action: {},
                          detected: {
                            type: "string",
                          },
                        },
                        required: ["action"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["piiEntities", "regexes"],
                  additionalProperties: false,
                },
                contextualGroundingPolicy: {
                  type: "object",
                  properties: {
                    filters: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: {},
                          threshold: {
                            type: "string",
                          },
                          score: {
                            type: "string",
                          },
                          action: {},
                          detected: {
                            type: "string",
                          },
                        },
                        required: ["type", "threshold", "score", "action"],
                        additionalProperties: false,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                automatedReasoningPolicy: {
                  type: "object",
                  properties: {
                    findings: {
                      type: "array",
                      items: {
                        oneOf: [
                          {
                            type: "object",
                            properties: {
                              valid: {},
                            },
                            required: ["valid"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              invalid: {},
                            },
                            required: ["invalid"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              satisfiable: {},
                            },
                            required: ["satisfiable"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              impossible: {},
                            },
                            required: ["impossible"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              translationAmbiguous: {},
                            },
                            required: ["translationAmbiguous"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              tooComplex: {},
                            },
                            required: ["tooComplex"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              noTranslations: {},
                            },
                            required: ["noTranslations"],
                            additionalProperties: false,
                          },
                        ],
                      },
                    },
                  },
                  additionalProperties: false,
                },
                invocationMetrics: {
                  type: "object",
                  properties: {
                    guardrailProcessingLatency: {
                      type: "number",
                    },
                    usage: {
                      type: "object",
                      properties: {
                        topicPolicyUnits: {
                          type: "number",
                        },
                        contentPolicyUnits: {
                          type: "number",
                        },
                        wordPolicyUnits: {
                          type: "number",
                        },
                        sensitiveInformationPolicyUnits: {
                          type: "number",
                        },
                        sensitiveInformationPolicyFreeUnits: {
                          type: "number",
                        },
                        contextualGroundingPolicyUnits: {
                          type: "number",
                        },
                        contentPolicyImageUnits: {
                          type: "number",
                        },
                        automatedReasoningPolicyUnits: {
                          type: "number",
                        },
                        automatedReasoningPolicies: {
                          type: "number",
                        },
                      },
                      required: [
                        "topicPolicyUnits",
                        "contentPolicyUnits",
                        "wordPolicyUnits",
                        "sensitiveInformationPolicyUnits",
                        "sensitiveInformationPolicyFreeUnits",
                        "contextualGroundingPolicyUnits",
                      ],
                      additionalProperties: false,
                    },
                    guardrailCoverage: {
                      type: "object",
                      properties: {
                        textCharacters: {
                          type: "object",
                          properties: {
                            guarded: {},
                            total: {},
                          },
                          additionalProperties: false,
                        },
                        images: {
                          type: "object",
                          properties: {
                            guarded: {},
                            total: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                appliedGuardrailDetails: {
                  type: "object",
                  properties: {
                    guardrailId: {
                      type: "string",
                    },
                    guardrailVersion: {
                      type: "string",
                    },
                    guardrailArn: {
                      type: "string",
                    },
                    guardrailOrigin: {
                      type: "array",
                      items: {
                        type: "string",
                        enum: [
                          "REQUEST",
                          "ACCOUNT_ENFORCED",
                          "ORGANIZATION_ENFORCED",
                        ],
                      },
                    },
                    guardrailOwnership: {
                      type: "string",
                      enum: ["SELF", "CROSS_ACCOUNT"],
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description:
              "The assessment details in the response from the guardrail.",
          },
          guardrailCoverage: {
            type: "object",
            properties: {
              textCharacters: {
                type: "object",
                properties: {
                  guarded: {
                    type: "number",
                  },
                  total: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              images: {
                type: "object",
                properties: {
                  guarded: {
                    type: "number",
                  },
                  total: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description:
              "The guardrail coverage details in the apply guardrail response.",
          },
        },
        required: ["usage", "action", "outputs", "assessments"],
      },
    },
  },
};

export default applyGuardrail;

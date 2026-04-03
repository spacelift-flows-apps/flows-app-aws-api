import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  TestTransformerCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const testTransformer: AppBlock = {
  name: "Test Transformer",
  description: `Use this operation to test a log transformer.`,
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
        transformerConfig: {
          name: "transformer Config",
          description:
            "This structure contains the configuration of this log transformer that you want to test.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                addKeys: {
                  type: "object",
                  properties: {
                    entries: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["entries"],
                  additionalProperties: false,
                },
                copyValue: {
                  type: "object",
                  properties: {
                    entries: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["entries"],
                  additionalProperties: false,
                },
                csv: {
                  type: "object",
                  properties: {
                    quoteCharacter: {
                      type: "string",
                    },
                    delimiter: {
                      type: "string",
                    },
                    columns: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    source: {
                      type: "string",
                    },
                    destination: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                dateTimeConverter: {
                  type: "object",
                  properties: {
                    source: {
                      type: "string",
                    },
                    target: {
                      type: "string",
                    },
                    targetFormat: {
                      type: "string",
                    },
                    matchPatterns: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    sourceTimezone: {
                      type: "string",
                    },
                    targetTimezone: {
                      type: "string",
                    },
                    locale: {
                      type: "string",
                    },
                  },
                  required: ["source", "target", "matchPatterns"],
                  additionalProperties: false,
                },
                deleteKeys: {
                  type: "object",
                  properties: {
                    withKeys: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["withKeys"],
                  additionalProperties: false,
                },
                grok: {
                  type: "object",
                  properties: {
                    source: {
                      type: "string",
                    },
                    match: {
                      type: "string",
                    },
                  },
                  required: ["match"],
                  additionalProperties: false,
                },
                listToMap: {
                  type: "object",
                  properties: {
                    source: {
                      type: "string",
                    },
                    key: {
                      type: "string",
                    },
                    valueKey: {
                      type: "string",
                    },
                    target: {
                      type: "string",
                    },
                    flatten: {
                      type: "boolean",
                    },
                    flattenedElement: {
                      type: "string",
                    },
                  },
                  required: ["source", "key"],
                  additionalProperties: false,
                },
                lowerCaseString: {
                  type: "object",
                  properties: {
                    withKeys: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["withKeys"],
                  additionalProperties: false,
                },
                moveKeys: {
                  type: "object",
                  properties: {
                    entries: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["entries"],
                  additionalProperties: false,
                },
                parseCloudfront: {
                  type: "object",
                  properties: {
                    source: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                parseJSON: {
                  type: "object",
                  properties: {
                    source: {
                      type: "string",
                    },
                    destination: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                parseKeyValue: {
                  type: "object",
                  properties: {
                    source: {
                      type: "string",
                    },
                    destination: {
                      type: "string",
                    },
                    fieldDelimiter: {
                      type: "string",
                    },
                    keyValueDelimiter: {
                      type: "string",
                    },
                    keyPrefix: {
                      type: "string",
                    },
                    nonMatchValue: {
                      type: "string",
                    },
                    overwriteIfExists: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
                parseRoute53: {
                  type: "object",
                  properties: {
                    source: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                parseToOCSF: {
                  type: "object",
                  properties: {
                    source: {
                      type: "string",
                    },
                    eventSource: {
                      type: "string",
                    },
                    ocsfVersion: {
                      type: "string",
                    },
                    mappingVersion: {
                      type: "string",
                    },
                  },
                  required: ["eventSource", "ocsfVersion"],
                  additionalProperties: false,
                },
                parsePostgres: {
                  type: "object",
                  properties: {
                    source: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                parseVPC: {
                  type: "object",
                  properties: {
                    source: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                parseWAF: {
                  type: "object",
                  properties: {
                    source: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                renameKeys: {
                  type: "object",
                  properties: {
                    entries: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["entries"],
                  additionalProperties: false,
                },
                splitString: {
                  type: "object",
                  properties: {
                    entries: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["entries"],
                  additionalProperties: false,
                },
                substituteString: {
                  type: "object",
                  properties: {
                    entries: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["entries"],
                  additionalProperties: false,
                },
                trimString: {
                  type: "object",
                  properties: {
                    withKeys: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["withKeys"],
                  additionalProperties: false,
                },
                typeConverter: {
                  type: "object",
                  properties: {
                    entries: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["entries"],
                  additionalProperties: false,
                },
                upperCaseString: {
                  type: "object",
                  properties: {
                    withKeys: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["withKeys"],
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
          },
          required: true,
        },
        logEventMessages: {
          name: "log Event Messages",
          description:
            "An array of the raw log events that you want to use to test this transformer.",
          type: {
            type: "array",
            items: {
              type: "string",
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new TestTransformerCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Test Transformer Result",
      description: "Result from TestTransformer operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          transformedLogs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                eventNumber: {
                  type: "number",
                },
                eventMessage: {
                  type: "string",
                },
                transformedEventMessage: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "An array where each member of the array includes both the original version and the transformed version of one of the log events that you input.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default testTransformer;

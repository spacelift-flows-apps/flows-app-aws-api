import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  CreateOriginRequestPolicyCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createOriginRequestPolicy: AppBlock = {
  name: "Create Origin Request Policy",
  description: `Creates an origin request policy.`,
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
        OriginRequestPolicyConfig: {
          name: "Origin Request Policy Config",
          description: "An origin request policy configuration.",
          type: {
            type: "object",
            properties: {
              Comment: {
                type: "string",
              },
              Name: {
                type: "string",
              },
              HeadersConfig: {
                type: "object",
                properties: {
                  HeaderBehavior: {
                    type: "string",
                  },
                  Headers: {
                    type: "object",
                    properties: {
                      Quantity: {
                        type: "number",
                      },
                      Items: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                    },
                    required: ["Quantity"],
                    additionalProperties: false,
                  },
                },
                required: ["HeaderBehavior"],
                additionalProperties: false,
              },
              CookiesConfig: {
                type: "object",
                properties: {
                  CookieBehavior: {
                    type: "string",
                  },
                  Cookies: {
                    type: "object",
                    properties: {
                      Quantity: {
                        type: "number",
                      },
                      Items: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                    },
                    required: ["Quantity"],
                    additionalProperties: false,
                  },
                },
                required: ["CookieBehavior"],
                additionalProperties: false,
              },
              QueryStringsConfig: {
                type: "object",
                properties: {
                  QueryStringBehavior: {
                    type: "string",
                  },
                  QueryStrings: {
                    type: "object",
                    properties: {
                      Quantity: {
                        type: "number",
                      },
                      Items: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                    },
                    required: ["Quantity"],
                    additionalProperties: false,
                  },
                },
                required: ["QueryStringBehavior"],
                additionalProperties: false,
              },
            },
            required: [
              "Name",
              "HeadersConfig",
              "CookiesConfig",
              "QueryStringsConfig",
            ],
            additionalProperties: false,
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateOriginRequestPolicyCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Origin Request Policy Result",
      description: "Result from CreateOriginRequestPolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          OriginRequestPolicy: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              LastModifiedTime: {
                type: "string",
              },
              OriginRequestPolicyConfig: {
                type: "object",
                properties: {
                  Comment: {
                    type: "string",
                  },
                  Name: {
                    type: "string",
                  },
                  HeadersConfig: {
                    type: "object",
                    properties: {
                      HeaderBehavior: {
                        type: "string",
                      },
                      Headers: {
                        type: "object",
                        properties: {
                          Quantity: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Quantity"],
                        additionalProperties: false,
                      },
                    },
                    required: ["HeaderBehavior"],
                    additionalProperties: false,
                  },
                  CookiesConfig: {
                    type: "object",
                    properties: {
                      CookieBehavior: {
                        type: "string",
                      },
                      Cookies: {
                        type: "object",
                        properties: {
                          Quantity: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Quantity"],
                        additionalProperties: false,
                      },
                    },
                    required: ["CookieBehavior"],
                    additionalProperties: false,
                  },
                  QueryStringsConfig: {
                    type: "object",
                    properties: {
                      QueryStringBehavior: {
                        type: "string",
                      },
                      QueryStrings: {
                        type: "object",
                        properties: {
                          Quantity: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Quantity"],
                        additionalProperties: false,
                      },
                    },
                    required: ["QueryStringBehavior"],
                    additionalProperties: false,
                  },
                },
                required: [
                  "Name",
                  "HeadersConfig",
                  "CookiesConfig",
                  "QueryStringsConfig",
                ],
                additionalProperties: false,
              },
            },
            required: ["Id", "LastModifiedTime", "OriginRequestPolicyConfig"],
            additionalProperties: false,
            description: "An origin request policy.",
          },
          Location: {
            type: "string",
            description:
              "The fully qualified URI of the origin request policy just created.",
          },
          ETag: {
            type: "string",
            description: "The current version of the origin request policy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createOriginRequestPolicy;

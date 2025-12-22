import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  GetCachePolicyCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getCachePolicy: AppBlock = {
  name: "Get Cache Policy",
  description: `Gets a cache policy, including the following metadata: The policy's identifier.`,
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
        Id: {
          name: "Id",
          description: "The unique identifier for the cache policy.",
          type: "string",
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
        }

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetCachePolicyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Cache Policy Result",
      description: "Result from GetCachePolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CachePolicy: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              LastModifiedTime: {
                type: "string",
              },
              CachePolicyConfig: {
                type: "object",
                properties: {
                  Comment: {
                    type: "string",
                  },
                  Name: {
                    type: "string",
                  },
                  DefaultTTL: {
                    type: "number",
                  },
                  MaxTTL: {
                    type: "number",
                  },
                  MinTTL: {
                    type: "number",
                  },
                  ParametersInCacheKeyAndForwardedToOrigin: {
                    type: "object",
                    properties: {
                      EnableAcceptEncodingGzip: {
                        type: "boolean",
                      },
                      EnableAcceptEncodingBrotli: {
                        type: "boolean",
                      },
                      HeadersConfig: {
                        type: "object",
                        properties: {
                          HeaderBehavior: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Headers: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["HeaderBehavior"],
                        additionalProperties: false,
                      },
                      CookiesConfig: {
                        type: "object",
                        properties: {
                          CookieBehavior: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Cookies: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["CookieBehavior"],
                        additionalProperties: false,
                      },
                      QueryStringsConfig: {
                        type: "object",
                        properties: {
                          QueryStringBehavior: {
                            type: "object",
                            additionalProperties: true,
                          },
                          QueryStrings: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["QueryStringBehavior"],
                        additionalProperties: false,
                      },
                    },
                    required: [
                      "EnableAcceptEncodingGzip",
                      "HeadersConfig",
                      "CookiesConfig",
                      "QueryStringsConfig",
                    ],
                    additionalProperties: false,
                  },
                },
                required: ["Name", "MinTTL"],
                additionalProperties: false,
              },
            },
            required: ["Id", "LastModifiedTime", "CachePolicyConfig"],
            additionalProperties: false,
            description: "The cache policy.",
          },
          ETag: {
            type: "string",
            description: "The current version of the cache policy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getCachePolicy;

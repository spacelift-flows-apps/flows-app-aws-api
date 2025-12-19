import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  UpdateStreamingDistributionCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateStreamingDistribution: AppBlock = {
  name: "Update Streaming Distribution",
  description: `Update a streaming distribution.`,
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
        StreamingDistributionConfig: {
          name: "Streaming Distribution Config",
          description:
            "The streaming distribution's configuration information.",
          type: {
            type: "object",
            properties: {
              CallerReference: {
                type: "string",
              },
              S3Origin: {
                type: "object",
                properties: {
                  DomainName: {
                    type: "string",
                  },
                  OriginAccessIdentity: {
                    type: "string",
                  },
                },
                required: ["DomainName", "OriginAccessIdentity"],
                additionalProperties: false,
              },
              Aliases: {
                type: "object",
                properties: {
                  Quantity: {
                    type: "number",
                  },
                  Items: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                required: ["Quantity"],
                additionalProperties: false,
              },
              Comment: {
                type: "string",
              },
              Logging: {
                type: "object",
                properties: {
                  Enabled: {
                    type: "boolean",
                  },
                  Bucket: {
                    type: "string",
                  },
                  Prefix: {
                    type: "string",
                  },
                },
                required: ["Enabled", "Bucket", "Prefix"],
                additionalProperties: false,
              },
              TrustedSigners: {
                type: "object",
                properties: {
                  Enabled: {
                    type: "boolean",
                  },
                  Quantity: {
                    type: "number",
                  },
                  Items: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                required: ["Enabled", "Quantity"],
                additionalProperties: false,
              },
              PriceClass: {
                type: "string",
              },
              Enabled: {
                type: "boolean",
              },
            },
            required: [
              "CallerReference",
              "S3Origin",
              "Comment",
              "TrustedSigners",
              "Enabled",
            ],
            additionalProperties: false,
          },
          required: true,
        },
        Id: {
          name: "Id",
          description: "The streaming distribution's id.",
          type: "string",
          required: true,
        },
        IfMatch: {
          name: "If Match",
          description:
            "The value of the ETag header that you received when retrieving the streaming distribution's configuration.",
          type: "string",
          required: false,
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

        const command = new UpdateStreamingDistributionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Streaming Distribution Result",
      description: "Result from UpdateStreamingDistribution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StreamingDistribution: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              ARN: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              LastModifiedTime: {
                type: "string",
              },
              DomainName: {
                type: "string",
              },
              ActiveTrustedSigners: {
                type: "object",
                properties: {
                  Enabled: {
                    type: "boolean",
                  },
                  Quantity: {
                    type: "number",
                  },
                  Items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        AwsAccountNumber: {
                          type: "object",
                          additionalProperties: true,
                        },
                        KeyPairIds: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                required: ["Enabled", "Quantity"],
                additionalProperties: false,
              },
              StreamingDistributionConfig: {
                type: "object",
                properties: {
                  CallerReference: {
                    type: "string",
                  },
                  S3Origin: {
                    type: "object",
                    properties: {
                      DomainName: {
                        type: "string",
                      },
                      OriginAccessIdentity: {
                        type: "string",
                      },
                    },
                    required: ["DomainName", "OriginAccessIdentity"],
                    additionalProperties: false,
                  },
                  Aliases: {
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
                  Comment: {
                    type: "string",
                  },
                  Logging: {
                    type: "object",
                    properties: {
                      Enabled: {
                        type: "boolean",
                      },
                      Bucket: {
                        type: "string",
                      },
                      Prefix: {
                        type: "string",
                      },
                    },
                    required: ["Enabled", "Bucket", "Prefix"],
                    additionalProperties: false,
                  },
                  TrustedSigners: {
                    type: "object",
                    properties: {
                      Enabled: {
                        type: "boolean",
                      },
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
                    required: ["Enabled", "Quantity"],
                    additionalProperties: false,
                  },
                  PriceClass: {
                    type: "string",
                  },
                  Enabled: {
                    type: "boolean",
                  },
                },
                required: [
                  "CallerReference",
                  "S3Origin",
                  "Comment",
                  "TrustedSigners",
                  "Enabled",
                ],
                additionalProperties: false,
              },
            },
            required: [
              "Id",
              "ARN",
              "Status",
              "DomainName",
              "ActiveTrustedSigners",
              "StreamingDistributionConfig",
            ],
            additionalProperties: false,
            description: "The streaming distribution's information.",
          },
          ETag: {
            type: "string",
            description: "The current version of the configuration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateStreamingDistribution;

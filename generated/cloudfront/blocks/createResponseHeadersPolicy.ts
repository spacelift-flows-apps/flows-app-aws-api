import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  CreateResponseHeadersPolicyCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createResponseHeadersPolicy: AppBlock = {
  name: "Create Response Headers Policy",
  description: `Creates a response headers policy.`,
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
        ResponseHeadersPolicyConfig: {
          name: "Response Headers Policy Config",
          description:
            "Contains metadata about the response headers policy, and a set of configurations that specify the HTTP headers.",
          type: {
            type: "object",
            properties: {
              Comment: {
                type: "string",
              },
              Name: {
                type: "string",
              },
              CorsConfig: {
                type: "object",
                properties: {
                  AccessControlAllowOrigins: {
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
                    required: ["Quantity", "Items"],
                    additionalProperties: false,
                  },
                  AccessControlAllowHeaders: {
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
                    required: ["Quantity", "Items"],
                    additionalProperties: false,
                  },
                  AccessControlAllowMethods: {
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
                    required: ["Quantity", "Items"],
                    additionalProperties: false,
                  },
                  AccessControlAllowCredentials: {
                    type: "boolean",
                  },
                  AccessControlExposeHeaders: {
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
                  AccessControlMaxAgeSec: {
                    type: "number",
                  },
                  OriginOverride: {
                    type: "boolean",
                  },
                },
                required: [
                  "AccessControlAllowOrigins",
                  "AccessControlAllowHeaders",
                  "AccessControlAllowMethods",
                  "AccessControlAllowCredentials",
                  "OriginOverride",
                ],
                additionalProperties: false,
              },
              SecurityHeadersConfig: {
                type: "object",
                properties: {
                  XSSProtection: {
                    type: "object",
                    properties: {
                      Override: {
                        type: "boolean",
                      },
                      Protection: {
                        type: "boolean",
                      },
                      ModeBlock: {
                        type: "boolean",
                      },
                      ReportUri: {
                        type: "string",
                      },
                    },
                    required: ["Override", "Protection"],
                    additionalProperties: false,
                  },
                  FrameOptions: {
                    type: "object",
                    properties: {
                      Override: {
                        type: "boolean",
                      },
                      FrameOption: {
                        type: "string",
                      },
                    },
                    required: ["Override", "FrameOption"],
                    additionalProperties: false,
                  },
                  ReferrerPolicy: {
                    type: "object",
                    properties: {
                      Override: {
                        type: "boolean",
                      },
                      ReferrerPolicy: {
                        type: "string",
                      },
                    },
                    required: ["Override", "ReferrerPolicy"],
                    additionalProperties: false,
                  },
                  ContentSecurityPolicy: {
                    type: "object",
                    properties: {
                      Override: {
                        type: "boolean",
                      },
                      ContentSecurityPolicy: {
                        type: "string",
                      },
                    },
                    required: ["Override", "ContentSecurityPolicy"],
                    additionalProperties: false,
                  },
                  ContentTypeOptions: {
                    type: "object",
                    properties: {
                      Override: {
                        type: "boolean",
                      },
                    },
                    required: ["Override"],
                    additionalProperties: false,
                  },
                  StrictTransportSecurity: {
                    type: "object",
                    properties: {
                      Override: {
                        type: "boolean",
                      },
                      IncludeSubdomains: {
                        type: "boolean",
                      },
                      Preload: {
                        type: "boolean",
                      },
                      AccessControlMaxAgeSec: {
                        type: "number",
                      },
                    },
                    required: ["Override", "AccessControlMaxAgeSec"],
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              ServerTimingHeadersConfig: {
                type: "object",
                properties: {
                  Enabled: {
                    type: "boolean",
                  },
                  SamplingRate: {
                    type: "number",
                  },
                },
                required: ["Enabled"],
                additionalProperties: false,
              },
              CustomHeadersConfig: {
                type: "object",
                properties: {
                  Quantity: {
                    type: "number",
                  },
                  Items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Header: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Value: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Override: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Header", "Value", "Override"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["Quantity"],
                additionalProperties: false,
              },
              RemoveHeadersConfig: {
                type: "object",
                properties: {
                  Quantity: {
                    type: "number",
                  },
                  Items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Header: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Header"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["Quantity"],
                additionalProperties: false,
              },
            },
            required: ["Name"],
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

        const command = new CreateResponseHeadersPolicyCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Response Headers Policy Result",
      description: "Result from CreateResponseHeadersPolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ResponseHeadersPolicy: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              LastModifiedTime: {
                type: "string",
              },
              ResponseHeadersPolicyConfig: {
                type: "object",
                properties: {
                  Comment: {
                    type: "string",
                  },
                  Name: {
                    type: "string",
                  },
                  CorsConfig: {
                    type: "object",
                    properties: {
                      AccessControlAllowOrigins: {
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
                        required: ["Quantity", "Items"],
                        additionalProperties: false,
                      },
                      AccessControlAllowHeaders: {
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
                        required: ["Quantity", "Items"],
                        additionalProperties: false,
                      },
                      AccessControlAllowMethods: {
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
                        required: ["Quantity", "Items"],
                        additionalProperties: false,
                      },
                      AccessControlAllowCredentials: {
                        type: "boolean",
                      },
                      AccessControlExposeHeaders: {
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
                      AccessControlMaxAgeSec: {
                        type: "number",
                      },
                      OriginOverride: {
                        type: "boolean",
                      },
                    },
                    required: [
                      "AccessControlAllowOrigins",
                      "AccessControlAllowHeaders",
                      "AccessControlAllowMethods",
                      "AccessControlAllowCredentials",
                      "OriginOverride",
                    ],
                    additionalProperties: false,
                  },
                  SecurityHeadersConfig: {
                    type: "object",
                    properties: {
                      XSSProtection: {
                        type: "object",
                        properties: {
                          Override: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Protection: {
                            type: "object",
                            additionalProperties: true,
                          },
                          ModeBlock: {
                            type: "object",
                            additionalProperties: true,
                          },
                          ReportUri: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Override", "Protection"],
                        additionalProperties: false,
                      },
                      FrameOptions: {
                        type: "object",
                        properties: {
                          Override: {
                            type: "object",
                            additionalProperties: true,
                          },
                          FrameOption: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Override", "FrameOption"],
                        additionalProperties: false,
                      },
                      ReferrerPolicy: {
                        type: "object",
                        properties: {
                          Override: {
                            type: "object",
                            additionalProperties: true,
                          },
                          ReferrerPolicy: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Override", "ReferrerPolicy"],
                        additionalProperties: false,
                      },
                      ContentSecurityPolicy: {
                        type: "object",
                        properties: {
                          Override: {
                            type: "object",
                            additionalProperties: true,
                          },
                          ContentSecurityPolicy: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Override", "ContentSecurityPolicy"],
                        additionalProperties: false,
                      },
                      ContentTypeOptions: {
                        type: "object",
                        properties: {
                          Override: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Override"],
                        additionalProperties: false,
                      },
                      StrictTransportSecurity: {
                        type: "object",
                        properties: {
                          Override: {
                            type: "object",
                            additionalProperties: true,
                          },
                          IncludeSubdomains: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Preload: {
                            type: "object",
                            additionalProperties: true,
                          },
                          AccessControlMaxAgeSec: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Override", "AccessControlMaxAgeSec"],
                        additionalProperties: false,
                      },
                    },
                    additionalProperties: false,
                  },
                  ServerTimingHeadersConfig: {
                    type: "object",
                    properties: {
                      Enabled: {
                        type: "boolean",
                      },
                      SamplingRate: {
                        type: "number",
                      },
                    },
                    required: ["Enabled"],
                    additionalProperties: false,
                  },
                  CustomHeadersConfig: {
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
                  RemoveHeadersConfig: {
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
                required: ["Name"],
                additionalProperties: false,
              },
            },
            required: ["Id", "LastModifiedTime", "ResponseHeadersPolicyConfig"],
            additionalProperties: false,
            description: "Contains a response headers policy.",
          },
          Location: {
            type: "string",
            description: "The URL of the response headers policy.",
          },
          ETag: {
            type: "string",
            description:
              "The version identifier for the current version of the response headers policy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createResponseHeadersPolicy;

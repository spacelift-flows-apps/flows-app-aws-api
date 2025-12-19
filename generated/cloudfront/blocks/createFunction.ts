import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  CreateFunctionCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createFunction: AppBlock = {
  name: "Create Function",
  description: `Creates a CloudFront function.`,
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
        Name: {
          name: "Name",
          description: "A name to identify the function.",
          type: "string",
          required: true,
        },
        FunctionConfig: {
          name: "Function Config",
          description:
            "Configuration information about the function, including an optional comment and the function's runtime.",
          type: {
            type: "object",
            properties: {
              Comment: {
                type: "string",
              },
              Runtime: {
                type: "string",
              },
              KeyValueStoreAssociations: {
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
                        KeyValueStoreARN: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["KeyValueStoreARN"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["Quantity"],
                additionalProperties: false,
              },
            },
            required: ["Comment", "Runtime"],
            additionalProperties: false,
          },
          required: true,
        },
        FunctionCode: {
          name: "Function Code",
          description: "The function code.",
          type: "string",
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

        const command = new CreateFunctionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Function Result",
      description: "Result from CreateFunction operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          FunctionSummary: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              FunctionConfig: {
                type: "object",
                properties: {
                  Comment: {
                    type: "string",
                  },
                  Runtime: {
                    type: "string",
                  },
                  KeyValueStoreAssociations: {
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
                required: ["Comment", "Runtime"],
                additionalProperties: false,
              },
              FunctionMetadata: {
                type: "object",
                properties: {
                  FunctionARN: {
                    type: "string",
                  },
                  Stage: {
                    type: "string",
                  },
                  CreatedTime: {
                    type: "string",
                  },
                  LastModifiedTime: {
                    type: "string",
                  },
                },
                required: ["FunctionARN", "LastModifiedTime"],
                additionalProperties: false,
              },
            },
            required: ["Name", "FunctionConfig", "FunctionMetadata"],
            additionalProperties: false,
            description:
              "Contains configuration information and metadata about a CloudFront function.",
          },
          Location: {
            type: "string",
            description: "The URL of the CloudFront function.",
          },
          ETag: {
            type: "string",
            description:
              "The version identifier for the current version of the CloudFront function.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createFunction;

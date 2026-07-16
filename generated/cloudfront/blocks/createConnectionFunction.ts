import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  CreateConnectionFunctionCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createConnectionFunction: AppBlock = {
  name: "Create Connection Function",
  description: `Creates a connection function.`,
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
          description: "A name for the connection function.",
          type: "string",
          required: true,
        },
        ConnectionFunctionConfig: {
          name: "Connection Function Config",
          description:
            "Contains configuration information about a CloudFront function.",
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
                          type: "string",
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
        ConnectionFunctionCode: {
          name: "Connection Function Code",
          description: "The code for the connection function.",
          type: "string",
          required: true,
        },
        Tags: {
          name: "Tags",
          description:
            "A complex type that contains zero or more Tag elements.",
          type: {
            type: "object",
            properties: {
              Items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Key: {
                      type: "string",
                    },
                    Value: {
                      type: "string",
                    },
                  },
                  required: ["Key"],
                  additionalProperties: false,
                },
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateConnectionFunctionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Connection Function Result",
      description: "Result from CreateConnectionFunction operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ConnectionFunctionSummary: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              Id: {
                type: "string",
              },
              ConnectionFunctionConfig: {
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
                            KeyValueStoreARN: {},
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
              ConnectionFunctionArn: {
                type: "string",
              },
              Status: {
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
            required: [
              "Name",
              "Id",
              "ConnectionFunctionConfig",
              "ConnectionFunctionArn",
              "Status",
              "Stage",
              "CreatedTime",
              "LastModifiedTime",
            ],
            additionalProperties: false,
            description: "The summary for the connection function.",
          },
          Location: {
            type: "string",
            description: "The location of the connection function.",
          },
          ETag: {
            type: "string",
            description:
              "The version identifier for the current version of the connection function.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createConnectionFunction;

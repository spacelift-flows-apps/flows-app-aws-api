import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EventBridgeClient,
  CreateConnectionCommand,
} from "@aws-sdk/client-eventbridge";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createConnection: AppBlock = {
  name: "Create Connection",
  description: `Creates a connection.`,
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
          description: "The name for the connection to create.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "A description for the connection to create.",
          type: "string",
          required: false,
        },
        AuthorizationType: {
          name: "Authorization Type",
          description: "The type of authorization to use for the connection.",
          type: "string",
          required: true,
        },
        AuthParameters: {
          name: "Auth Parameters",
          description:
            "The authorization parameters to use to authorize with the endpoint.",
          type: {
            type: "object",
            properties: {
              BasicAuthParameters: {
                type: "object",
                properties: {
                  Username: {
                    type: "string",
                  },
                  Password: {
                    type: "string",
                  },
                },
                required: ["Username", "Password"],
                additionalProperties: false,
              },
              OAuthParameters: {
                type: "object",
                properties: {
                  ClientParameters: {
                    type: "object",
                    properties: {
                      ClientID: {
                        type: "string",
                      },
                      ClientSecret: {
                        type: "string",
                      },
                    },
                    required: ["ClientID", "ClientSecret"],
                    additionalProperties: false,
                  },
                  AuthorizationEndpoint: {
                    type: "string",
                  },
                  HttpMethod: {
                    type: "string",
                  },
                  OAuthHttpParameters: {
                    type: "object",
                    properties: {
                      HeaderParameters: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      QueryStringParameters: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      BodyParameters: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                },
                required: [
                  "ClientParameters",
                  "AuthorizationEndpoint",
                  "HttpMethod",
                ],
                additionalProperties: false,
              },
              ApiKeyAuthParameters: {
                type: "object",
                properties: {
                  ApiKeyName: {
                    type: "string",
                  },
                  ApiKeyValue: {
                    type: "string",
                  },
                },
                required: ["ApiKeyName", "ApiKeyValue"],
                additionalProperties: false,
              },
              InvocationHttpParameters: {
                type: "object",
                properties: {
                  HeaderParameters: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Key: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Value: {
                          type: "object",
                          additionalProperties: true,
                        },
                        IsValueSecret: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  QueryStringParameters: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Key: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Value: {
                          type: "object",
                          additionalProperties: true,
                        },
                        IsValueSecret: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  BodyParameters: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Key: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Value: {
                          type: "object",
                          additionalProperties: true,
                        },
                        IsValueSecret: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
              ConnectivityParameters: {
                type: "object",
                properties: {
                  ResourceParameters: {
                    type: "object",
                    properties: {
                      ResourceConfigurationArn: {
                        type: "string",
                      },
                    },
                    required: ["ResourceConfigurationArn"],
                    additionalProperties: false,
                  },
                },
                required: ["ResourceParameters"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: true,
        },
        InvocationConnectivityParameters: {
          name: "Invocation Connectivity Parameters",
          description:
            "For connections to private APIs, the parameters to use for invoking the API.",
          type: {
            type: "object",
            properties: {
              ResourceParameters: {
                type: "object",
                properties: {
                  ResourceConfigurationArn: {
                    type: "string",
                  },
                },
                required: ["ResourceConfigurationArn"],
                additionalProperties: false,
              },
            },
            required: ["ResourceParameters"],
            additionalProperties: false,
          },
          required: false,
        },
        KmsKeyIdentifier: {
          name: "Kms Key Identifier",
          description:
            "The identifier of the KMS customer managed key for EventBridge to use, if you choose to use a customer managed key to encrypt this connection.",
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

        const client = new EventBridgeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateConnectionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Connection Result",
      description: "Result from CreateConnection operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ConnectionArn: {
            type: "string",
            description:
              "The ARN of the connection that was created by the request.",
          },
          ConnectionState: {
            type: "string",
            description:
              "The state of the connection that was created by the request.",
          },
          CreationTime: {
            type: "string",
            description:
              "A time stamp for the time that the connection was created.",
          },
          LastModifiedTime: {
            type: "string",
            description:
              "A time stamp for the time that the connection was last updated.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createConnection;

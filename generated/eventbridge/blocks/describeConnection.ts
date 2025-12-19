import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EventBridgeClient,
  DescribeConnectionCommand,
} from "@aws-sdk/client-eventbridge";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeConnection: AppBlock = {
  name: "Describe Connection",
  description: `Retrieves details about a connection.`,
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
          description: "The name of the connection to retrieve.",
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

        const client = new EventBridgeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeConnectionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Connection Result",
      description: "Result from DescribeConnection operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ConnectionArn: {
            type: "string",
            description: "The ARN of the connection retrieved.",
          },
          Name: {
            type: "string",
            description: "The name of the connection retrieved.",
          },
          Description: {
            type: "string",
            description: "The description for the connection retrieved.",
          },
          InvocationConnectivityParameters: {
            type: "object",
            properties: {
              ResourceParameters: {
                type: "object",
                properties: {
                  ResourceConfigurationArn: {
                    type: "string",
                  },
                  ResourceAssociationArn: {
                    type: "string",
                  },
                },
                required: [
                  "ResourceConfigurationArn",
                  "ResourceAssociationArn",
                ],
                additionalProperties: false,
              },
            },
            required: ["ResourceParameters"],
            additionalProperties: false,
            description:
              "For connections to private APIs The parameters EventBridge uses to invoke the resource endpoint.",
          },
          ConnectionState: {
            type: "string",
            description: "The state of the connection retrieved.",
          },
          StateReason: {
            type: "string",
            description:
              "The reason that the connection is in the current connection state.",
          },
          AuthorizationType: {
            type: "string",
            description:
              "The type of authorization specified for the connection.",
          },
          SecretArn: {
            type: "string",
            description:
              "The ARN of the secret created from the authorization parameters specified for the connection.",
          },
          KmsKeyIdentifier: {
            type: "string",
            description:
              "The identifier of the KMS customer managed key for EventBridge to use to encrypt the connection, if one has been specified.",
          },
          AuthParameters: {
            type: "object",
            properties: {
              BasicAuthParameters: {
                type: "object",
                properties: {
                  Username: {
                    type: "string",
                  },
                },
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
                    },
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
                additionalProperties: false,
              },
              ApiKeyAuthParameters: {
                type: "object",
                properties: {
                  ApiKeyName: {
                    type: "string",
                  },
                },
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
                      ResourceAssociationArn: {
                        type: "string",
                      },
                    },
                    required: [
                      "ResourceConfigurationArn",
                      "ResourceAssociationArn",
                    ],
                    additionalProperties: false,
                  },
                },
                required: ["ResourceParameters"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description:
              "The parameters to use for authorization for the connection.",
          },
          CreationTime: {
            type: "string",
            description:
              "A time stamp for the time that the connection was created.",
          },
          LastModifiedTime: {
            type: "string",
            description:
              "A time stamp for the time that the connection was last modified.",
          },
          LastAuthorizedTime: {
            type: "string",
            description:
              "A time stamp for the time that the connection was last authorized.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeConnection;

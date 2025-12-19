import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  UpdateFieldLevelEncryptionConfigCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateFieldLevelEncryptionConfig: AppBlock = {
  name: "Update Field Level Encryption Config",
  description: `Update a field-level encryption configuration.`,
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
        FieldLevelEncryptionConfig: {
          name: "Field Level Encryption Config",
          description:
            "Request to update a field-level encryption configuration.",
          type: {
            type: "object",
            properties: {
              CallerReference: {
                type: "string",
              },
              Comment: {
                type: "string",
              },
              QueryArgProfileConfig: {
                type: "object",
                properties: {
                  ForwardWhenQueryArgProfileIsUnknown: {
                    type: "boolean",
                  },
                  QueryArgProfiles: {
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
                required: ["ForwardWhenQueryArgProfileIsUnknown"],
                additionalProperties: false,
              },
              ContentTypeProfileConfig: {
                type: "object",
                properties: {
                  ForwardWhenContentTypeIsUnknown: {
                    type: "boolean",
                  },
                  ContentTypeProfiles: {
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
                required: ["ForwardWhenContentTypeIsUnknown"],
                additionalProperties: false,
              },
            },
            required: ["CallerReference"],
            additionalProperties: false,
          },
          required: true,
        },
        Id: {
          name: "Id",
          description: "The ID of the configuration you want to update.",
          type: "string",
          required: true,
        },
        IfMatch: {
          name: "If Match",
          description:
            "The value of the ETag header that you received when retrieving the configuration identity to update.",
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

        const command = new UpdateFieldLevelEncryptionConfigCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Field Level Encryption Config Result",
      description: "Result from UpdateFieldLevelEncryptionConfig operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          FieldLevelEncryption: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              LastModifiedTime: {
                type: "string",
              },
              FieldLevelEncryptionConfig: {
                type: "object",
                properties: {
                  CallerReference: {
                    type: "string",
                  },
                  Comment: {
                    type: "string",
                  },
                  QueryArgProfileConfig: {
                    type: "object",
                    properties: {
                      ForwardWhenQueryArgProfileIsUnknown: {
                        type: "boolean",
                      },
                      QueryArgProfiles: {
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
                    required: ["ForwardWhenQueryArgProfileIsUnknown"],
                    additionalProperties: false,
                  },
                  ContentTypeProfileConfig: {
                    type: "object",
                    properties: {
                      ForwardWhenContentTypeIsUnknown: {
                        type: "boolean",
                      },
                      ContentTypeProfiles: {
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
                    required: ["ForwardWhenContentTypeIsUnknown"],
                    additionalProperties: false,
                  },
                },
                required: ["CallerReference"],
                additionalProperties: false,
              },
            },
            required: ["Id", "LastModifiedTime", "FieldLevelEncryptionConfig"],
            additionalProperties: false,
            description: "Return the results of updating the configuration.",
          },
          ETag: {
            type: "string",
            description:
              "The value of the ETag header that you received when updating the configuration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateFieldLevelEncryptionConfig;

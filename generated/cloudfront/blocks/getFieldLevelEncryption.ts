import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  GetFieldLevelEncryptionCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getFieldLevelEncryption: AppBlock = {
  name: "Get Field Level Encryption",
  description: `Get the field-level encryption configuration information.`,
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
          description:
            "Request the ID for the field-level encryption configuration information.",
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

        const command = new GetFieldLevelEncryptionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Field Level Encryption Result",
      description: "Result from GetFieldLevelEncryption operation",
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
            description:
              "Return the field-level encryption configuration information.",
          },
          ETag: {
            type: "string",
            description:
              "The current version of the field level encryption configuration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getFieldLevelEncryption;

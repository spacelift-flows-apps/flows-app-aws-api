import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  CreateFieldLevelEncryptionProfileCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createFieldLevelEncryptionProfile: AppBlock = {
  name: "Create Field Level Encryption Profile",
  description: `Create a field-level encryption profile.`,
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
        FieldLevelEncryptionProfileConfig: {
          name: "Field Level Encryption Profile Config",
          description:
            "The request to create a field-level encryption profile.",
          type: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              CallerReference: {
                type: "string",
              },
              Comment: {
                type: "string",
              },
              EncryptionEntities: {
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
                        PublicKeyId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ProviderId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        FieldPatterns: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["PublicKeyId", "ProviderId", "FieldPatterns"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["Quantity"],
                additionalProperties: false,
              },
            },
            required: ["Name", "CallerReference", "EncryptionEntities"],
            additionalProperties: false,
          },
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

        const command = new CreateFieldLevelEncryptionProfileCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Field Level Encryption Profile Result",
      description: "Result from CreateFieldLevelEncryptionProfile operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          FieldLevelEncryptionProfile: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              LastModifiedTime: {
                type: "string",
              },
              FieldLevelEncryptionProfileConfig: {
                type: "object",
                properties: {
                  Name: {
                    type: "string",
                  },
                  CallerReference: {
                    type: "string",
                  },
                  Comment: {
                    type: "string",
                  },
                  EncryptionEntities: {
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
                required: ["Name", "CallerReference", "EncryptionEntities"],
                additionalProperties: false,
              },
            },
            required: [
              "Id",
              "LastModifiedTime",
              "FieldLevelEncryptionProfileConfig",
            ],
            additionalProperties: false,
            description:
              "Returned when you create a new field-level encryption profile.",
          },
          Location: {
            type: "string",
            description:
              "The fully qualified URI of the new profile resource just created.",
          },
          ETag: {
            type: "string",
            description:
              "The current version of the field level encryption profile.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createFieldLevelEncryptionProfile;

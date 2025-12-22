import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, ReEncryptCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const reEncrypt: AppBlock = {
  name: "Re Encrypt",
  description: `Decrypts ciphertext and then reencrypts it entirely within KMS.`,
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
        CiphertextBlob: {
          name: "Ciphertext Blob",
          description: "Ciphertext of the data to reencrypt.",
          type: "string",
          required: true,
        },
        SourceEncryptionContext: {
          name: "Source Encryption Context",
          description:
            "Specifies the encryption context to use to decrypt the ciphertext.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        SourceKeyId: {
          name: "Source Key Id",
          description:
            "Specifies the KMS key that KMS will use to decrypt the ciphertext before it is re-encrypted.",
          type: "string",
          required: false,
        },
        DestinationKeyId: {
          name: "Destination Key Id",
          description:
            "A unique identifier for the KMS key that is used to reencrypt the data.",
          type: "string",
          required: true,
        },
        DestinationEncryptionContext: {
          name: "Destination Encryption Context",
          description:
            "Specifies that encryption context to use when the reencrypting the data.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        SourceEncryptionAlgorithm: {
          name: "Source Encryption Algorithm",
          description:
            "Specifies the encryption algorithm that KMS will use to decrypt the ciphertext before it is reencrypted.",
          type: "string",
          required: false,
        },
        DestinationEncryptionAlgorithm: {
          name: "Destination Encryption Algorithm",
          description:
            "Specifies the encryption algorithm that KMS will use to reecrypt the data after it has decrypted it.",
          type: "string",
          required: false,
        },
        GrantTokens: {
          name: "Grant Tokens",
          description: "A list of grant tokens.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description: "Checks if your request will succeed.",
          type: "boolean",
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

        const client = new KMSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ReEncryptCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Re Encrypt Result",
      description: "Result from ReEncrypt operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CiphertextBlob: {
            type: "string",
            description: "The reencrypted data.",
          },
          SourceKeyId: {
            type: "string",
            description:
              "Unique identifier of the KMS key used to originally encrypt the data.",
          },
          KeyId: {
            type: "string",
            description:
              "The Amazon Resource Name (key ARN) of the KMS key that was used to reencrypt the data.",
          },
          SourceEncryptionAlgorithm: {
            type: "string",
            description:
              "The encryption algorithm that was used to decrypt the ciphertext before it was reencrypted.",
          },
          DestinationEncryptionAlgorithm: {
            type: "string",
            description:
              "The encryption algorithm that was used to reencrypt the data.",
          },
          SourceKeyMaterialId: {
            type: "string",
            description:
              "The identifier of the key material used to originally encrypt the data.",
          },
          DestinationKeyMaterialId: {
            type: "string",
            description:
              "The identifier of the key material used to reencrypt the data.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default reEncrypt;

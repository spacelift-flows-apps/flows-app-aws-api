import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, DeriveSharedSecretCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deriveSharedSecret: AppBlock = {
  name: "Derive Shared Secret",
  description: `Derives a shared secret using a key agreement algorithm.`,
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
        KeyId: {
          name: "Key Id",
          description:
            "Identifies an asymmetric NIST-standard ECC or SM2 (China Regions only) KMS key.",
          type: "string",
          required: true,
        },
        KeyAgreementAlgorithm: {
          name: "Key Agreement Algorithm",
          description:
            "Specifies the key agreement algorithm used to derive the shared secret.",
          type: {
            type: "string",
            enum: ["ECDH"],
          },
          required: true,
        },
        PublicKey: {
          name: "Public Key",
          description:
            "Specifies the public key in your peer's NIST-standard elliptic curve (ECC) or SM2 (China Regions only) key pair.",
          type: "string",
          required: true,
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
        Recipient: {
          name: "Recipient",
          description:
            "A signed attestation document from an Amazon Web Services Nitro enclave or NitroTPM, and the encryption algorithm to use with the public key in the attestation document.",
          type: {
            type: "object",
            properties: {
              KeyEncryptionAlgorithm: {
                type: "string",
                enum: ["RSAES_OAEP_SHA_256"],
              },
              AttestationDocument: {
                type: "string",
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

        const client = new KMSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeriveSharedSecretCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Derive Shared Secret Result",
      description: "Result from DeriveSharedSecret operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          KeyId: {
            type: "string",
            description:
              "Identifies the KMS key used to derive the shared secret.",
          },
          SharedSecret: {
            type: "string",
            description:
              "The raw secret derived from the specified key agreement algorithm, private key in the asymmetric KMS key, and your peer's public key.",
          },
          CiphertextForRecipient: {
            type: "string",
            description:
              "The plaintext shared secret encrypted with the public key from the attestation document.",
          },
          KeyAgreementAlgorithm: {
            type: "string",
            enum: ["ECDH"],
            description:
              "Identifies the key agreement algorithm used to derive the shared secret.",
          },
          KeyOrigin: {
            type: "string",
            enum: ["AWS_KMS", "EXTERNAL", "AWS_CLOUDHSM", "EXTERNAL_KEY_STORE"],
            description:
              "The source of the key material for the specified KMS key.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deriveSharedSecret;

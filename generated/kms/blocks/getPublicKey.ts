import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, GetPublicKeyCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getPublicKey: AppBlock = {
  name: "Get Public Key",
  description: `Returns the public key of an asymmetric KMS key.`,
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
            "Identifies the asymmetric KMS key that includes the public key.",
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

        const command = new GetPublicKeyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Public Key Result",
      description: "Result from GetPublicKey operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          KeyId: {
            type: "string",
            description:
              "The Amazon Resource Name (key ARN) of the asymmetric KMS key from which the public key was downloaded.",
          },
          PublicKey: {
            type: "string",
            description: "The exported public key.",
          },
          CustomerMasterKeySpec: {
            type: "string",
            enum: [
              "RSA_2048",
              "RSA_3072",
              "RSA_4096",
              "ECC_NIST_P256",
              "ECC_NIST_P384",
              "ECC_NIST_P521",
              "ECC_SECG_P256K1",
              "SYMMETRIC_DEFAULT",
              "HMAC_224",
              "HMAC_256",
              "HMAC_384",
              "HMAC_512",
              "SM2",
            ],
            description:
              "Instead, use the KeySpec field in the GetPublicKey response.",
          },
          KeySpec: {
            type: "string",
            enum: [
              "RSA_2048",
              "RSA_3072",
              "RSA_4096",
              "ECC_NIST_P256",
              "ECC_NIST_P384",
              "ECC_NIST_P521",
              "ECC_SECG_P256K1",
              "SYMMETRIC_DEFAULT",
              "HMAC_224",
              "HMAC_256",
              "HMAC_384",
              "HMAC_512",
              "SM2",
              "ML_DSA_44",
              "ML_DSA_65",
              "ML_DSA_87",
              "ECC_NIST_EDWARDS25519",
            ],
            description:
              "The type of the of the public key that was downloaded.",
          },
          KeyUsage: {
            type: "string",
            enum: [
              "SIGN_VERIFY",
              "ENCRYPT_DECRYPT",
              "GENERATE_VERIFY_MAC",
              "KEY_AGREEMENT",
            ],
            description: "The permitted use of the public key.",
          },
          EncryptionAlgorithms: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "SYMMETRIC_DEFAULT",
                "RSAES_OAEP_SHA_1",
                "RSAES_OAEP_SHA_256",
                "SM2PKE",
              ],
            },
            description:
              "The encryption algorithms that KMS supports for this key.",
          },
          SigningAlgorithms: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "RSASSA_PSS_SHA_256",
                "RSASSA_PSS_SHA_384",
                "RSASSA_PSS_SHA_512",
                "RSASSA_PKCS1_V1_5_SHA_256",
                "RSASSA_PKCS1_V1_5_SHA_384",
                "RSASSA_PKCS1_V1_5_SHA_512",
                "ECDSA_SHA_256",
                "ECDSA_SHA_384",
                "ECDSA_SHA_512",
                "SM2DSA",
                "ML_DSA_SHAKE_256",
                "ED25519_SHA_512",
                "ED25519_PH_SHA_512",
              ],
            },
            description:
              "The signing algorithms that KMS supports for this key.",
          },
          KeyAgreementAlgorithms: {
            type: "array",
            items: {
              type: "string",
              enum: ["ECDH"],
            },
            description:
              "The key agreement algorithm used to derive a shared secret.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getPublicKey;

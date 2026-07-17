import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeKey: AppBlock = {
  name: "Describe Key",
  description: `Provides detailed information about a KMS key.`,
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
          description: "Describes the specified KMS key.",
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

        const command = new DescribeKeyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Key Result",
      description: "Result from DescribeKey operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          KeyMetadata: {
            type: "object",
            properties: {
              AWSAccountId: {
                type: "string",
              },
              KeyId: {
                type: "string",
              },
              Arn: {
                type: "string",
              },
              CreationDate: {
                type: "string",
              },
              Enabled: {
                type: "boolean",
              },
              Description: {
                type: "string",
              },
              KeyUsage: {
                type: "string",
                enum: [
                  "SIGN_VERIFY",
                  "ENCRYPT_DECRYPT",
                  "GENERATE_VERIFY_MAC",
                  "KEY_AGREEMENT",
                ],
              },
              KeyState: {
                type: "string",
                enum: [
                  "Creating",
                  "Enabled",
                  "Disabled",
                  "PendingDeletion",
                  "PendingImport",
                  "PendingReplicaDeletion",
                  "Unavailable",
                  "Updating",
                ],
              },
              DeletionDate: {
                type: "string",
              },
              ValidTo: {
                type: "string",
              },
              Origin: {
                type: "string",
                enum: [
                  "AWS_KMS",
                  "EXTERNAL",
                  "AWS_CLOUDHSM",
                  "EXTERNAL_KEY_STORE",
                ],
              },
              CustomKeyStoreId: {
                type: "string",
              },
              CloudHsmClusterId: {
                type: "string",
              },
              ExpirationModel: {
                type: "string",
                enum: ["KEY_MATERIAL_EXPIRES", "KEY_MATERIAL_DOES_NOT_EXPIRE"],
              },
              KeyManager: {
                type: "string",
                enum: ["AWS", "CUSTOMER"],
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
              },
              KeyAgreementAlgorithms: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["ECDH"],
                },
              },
              MultiRegion: {
                type: "boolean",
              },
              MultiRegionConfiguration: {
                type: "object",
                properties: {
                  MultiRegionKeyType: {
                    type: "string",
                    enum: ["PRIMARY", "REPLICA"],
                  },
                  PrimaryKey: {
                    type: "object",
                    properties: {
                      Arn: {
                        type: "string",
                      },
                      Region: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                  ReplicaKeys: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Arn: {
                          type: "string",
                        },
                        Region: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
              PendingDeletionWindowInDays: {
                type: "number",
              },
              MacAlgorithms: {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "HMAC_SHA_224",
                    "HMAC_SHA_256",
                    "HMAC_SHA_384",
                    "HMAC_SHA_512",
                  ],
                },
              },
              XksKeyConfiguration: {
                type: "object",
                properties: {
                  Id: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              CurrentKeyMaterialId: {
                type: "string",
              },
            },
            required: ["KeyId"],
            additionalProperties: false,
            description: "Metadata associated with the key.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeKey;

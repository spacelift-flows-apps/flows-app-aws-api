import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, CreateKeyCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createKey: AppBlock = {
  name: "Create Key",
  description: `Creates a unique customer managed KMS key in your Amazon Web Services account and Region.`,
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
        Policy: {
          name: "Policy",
          description: "The key policy to attach to the KMS key.",
          type: "string",
          required: false,
        },
        Description: {
          name: "Description",
          description: "A description of the KMS key.",
          type: "string",
          required: false,
        },
        KeyUsage: {
          name: "Key Usage",
          description:
            "Determines the cryptographic operations for which you can use the KMS key.",
          type: "string",
          required: false,
        },
        CustomerMasterKeySpec: {
          name: "Customer Master Key Spec",
          description: "Instead, use the KeySpec parameter.",
          type: "string",
          required: false,
        },
        KeySpec: {
          name: "Key Spec",
          description: "Specifies the type of KMS key to create.",
          type: "string",
          required: false,
        },
        Origin: {
          name: "Origin",
          description: "The source of the key material for the KMS key.",
          type: "string",
          required: false,
        },
        CustomKeyStoreId: {
          name: "Custom Key Store Id",
          description: "Creates the KMS key in the specified custom key store.",
          type: "string",
          required: false,
        },
        BypassPolicyLockoutSafetyCheck: {
          name: "Bypass Policy Lockout Safety Check",
          description:
            'Skips ("bypasses") the key policy lockout safety check.',
          type: "boolean",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "Assigns one or more tags to the KMS key.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                TagKey: {
                  type: "string",
                },
                TagValue: {
                  type: "string",
                },
              },
              required: ["TagKey", "TagValue"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        MultiRegion: {
          name: "Multi Region",
          description:
            "Creates a multi-Region primary key that you can replicate into other Amazon Web Services Regions.",
          type: "boolean",
          required: false,
        },
        XksKeyId: {
          name: "Xks Key Id",
          description:
            "Identifies the external key that serves as key material for the KMS key in an external key store.",
          type: "string",
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

        const command = new CreateKeyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Key Result",
      description: "Result from CreateKey operation",
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
              },
              KeyState: {
                type: "string",
              },
              DeletionDate: {
                type: "string",
              },
              ValidTo: {
                type: "string",
              },
              Origin: {
                type: "string",
              },
              CustomKeyStoreId: {
                type: "string",
              },
              CloudHsmClusterId: {
                type: "string",
              },
              ExpirationModel: {
                type: "string",
              },
              KeyManager: {
                type: "string",
              },
              CustomerMasterKeySpec: {
                type: "string",
              },
              KeySpec: {
                type: "string",
              },
              EncryptionAlgorithms: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              SigningAlgorithms: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              KeyAgreementAlgorithms: {
                type: "array",
                items: {
                  type: "string",
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
                          type: "object",
                          additionalProperties: true,
                        },
                        Region: {
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
              PendingDeletionWindowInDays: {
                type: "number",
              },
              MacAlgorithms: {
                type: "array",
                items: {
                  type: "string",
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
            description: "Metadata associated with the KMS key.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createKey;

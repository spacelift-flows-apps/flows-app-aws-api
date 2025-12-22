import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, ReplicateKeyCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const replicateKey: AppBlock = {
  name: "Replicate Key",
  description: `Replicates a multi-Region key into the specified Region.`,
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
            "Identifies the multi-Region primary key that is being replicated.",
          type: "string",
          required: true,
        },
        ReplicaRegion: {
          name: "Replica Region",
          description:
            "The Region ID of the Amazon Web Services Region for this replica key.",
          type: "string",
          required: true,
        },
        Policy: {
          name: "Policy",
          description: "The key policy to attach to the KMS key.",
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
        Description: {
          name: "Description",
          description: "A description of the KMS key.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "Assigns one or more tags to the replica key.",
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

        const command = new ReplicateKeyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Replicate Key Result",
      description: "Result from ReplicateKey operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ReplicaKeyMetadata: {
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
            description:
              "Displays details about the new replica key, including its Amazon Resource Name (key ARN) and Key states of KMS keys.",
          },
          ReplicaPolicy: {
            type: "string",
            description: "The key policy of the new replica key.",
          },
          ReplicaTags: {
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
            description: "The tags on the new replica key.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default replicateKey;

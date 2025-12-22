import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SecretsManagerClient,
  CreateSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createSecret: AppBlock = {
  name: "Create Secret",
  description: `Creates a new secret.`,
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
          description: "The name of the new secret.",
          type: "string",
          required: true,
        },
        ClientRequestToken: {
          name: "Client Request Token",
          description:
            "If you include SecretString or SecretBinary, then Secrets Manager creates an initial version for the secret, and this parameter specifies the unique identifier for the new version.",
          type: "string",
          required: false,
        },
        Description: {
          name: "Description",
          description: "The description of the secret.",
          type: "string",
          required: false,
        },
        KmsKeyId: {
          name: "Kms Key Id",
          description:
            "The ARN, key ID, or alias of the KMS key that Secrets Manager uses to encrypt the secret value in the secret.",
          type: "string",
          required: false,
        },
        SecretBinary: {
          name: "Secret Binary",
          description:
            "The binary data to encrypt and store in the new version of the secret.",
          type: "string",
          required: false,
        },
        SecretString: {
          name: "Secret String",
          description:
            "The text data to encrypt and store in this new version of the secret.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "A list of tags to attach to the secret.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        AddReplicaRegions: {
          name: "Add Replica Regions",
          description: "A list of Regions and KMS keys to replicate secrets.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Region: {
                  type: "string",
                },
                KmsKeyId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        ForceOverwriteReplicaSecret: {
          name: "Force Overwrite Replica Secret",
          description:
            "Specifies whether to overwrite a secret with the same name in the destination Region.",
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

        const client = new SecretsManagerClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateSecretCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Secret Result",
      description: "Result from CreateSecret operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ARN: {
            type: "string",
            description: "The ARN of the new secret.",
          },
          Name: {
            type: "string",
            description: "The name of the new secret.",
          },
          VersionId: {
            type: "string",
            description:
              "The unique identifier associated with the version of the new secret.",
          },
          ReplicationStatus: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Region: {
                  type: "string",
                },
                KmsKeyId: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                StatusMessage: {
                  type: "string",
                },
                LastAccessedDate: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of the replicas of this secret and their status: Failed, which indicates that the replica was not created.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createSecret;

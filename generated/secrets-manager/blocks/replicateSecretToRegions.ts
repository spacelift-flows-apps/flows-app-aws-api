import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SecretsManagerClient,
  ReplicateSecretToRegionsCommand,
} from "@aws-sdk/client-secrets-manager";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const replicateSecretToRegions: AppBlock = {
  name: "Replicate Secret To Regions",
  description: `Replicates the secret to a new Regions.`,
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
        SecretId: {
          name: "Secret Id",
          description: "The ARN or name of the secret to replicate.",
          type: "string",
          required: true,
        },
        AddReplicaRegions: {
          name: "Add Replica Regions",
          description: "A list of Regions in which to replicate the secret.",
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
          required: true,
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

        const client = new SecretsManagerClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ReplicateSecretToRegionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Replicate Secret To Regions Result",
      description: "Result from ReplicateSecretToRegions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ARN: {
            type: "string",
            description: "The ARN of the primary secret.",
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
            description: "The status of replication.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default replicateSecretToRegions;

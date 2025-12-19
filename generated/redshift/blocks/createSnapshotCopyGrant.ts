import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  CreateSnapshotCopyGrantCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createSnapshotCopyGrant: AppBlock = {
  name: "Create Snapshot Copy Grant",
  description: `Creates a snapshot copy grant that permits Amazon Redshift to use an encrypted symmetric key from Key Management Service (KMS) to encrypt copied snapshots in a destination region.`,
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
        SnapshotCopyGrantName: {
          name: "Snapshot Copy Grant Name",
          description: "The name of the snapshot copy grant.",
          type: "string",
          required: true,
        },
        KmsKeyId: {
          name: "Kms Key Id",
          description:
            "The unique identifier of the encrypted symmetric key to which to grant Amazon Redshift permission.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "A list of tag instances.",
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
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateSnapshotCopyGrantCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Snapshot Copy Grant Result",
      description: "Result from CreateSnapshotCopyGrant operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SnapshotCopyGrant: {
            type: "object",
            properties: {
              SnapshotCopyGrantName: {
                type: "string",
              },
              KmsKeyId: {
                type: "string",
              },
              Tags: {
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
            },
            additionalProperties: false,
            description:
              "The snapshot copy grant that grants Amazon Redshift permission to encrypt copied snapshots with the specified encrypted symmetric key from Amazon Web Services KMS in the destination region.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createSnapshotCopyGrant;

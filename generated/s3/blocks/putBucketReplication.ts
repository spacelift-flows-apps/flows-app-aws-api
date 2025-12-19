import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, PutBucketReplicationCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const putBucketReplication: AppBlock = {
  name: "Put Bucket Replication",
  description: `This operation is not supported for directory buckets.`,
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
        Bucket: {
          name: "Bucket",
          description: "The name of the bucket",
          type: "string",
          required: true,
        },
        ContentMD5: {
          name: "Content MD5",
          description: "The Base64 encoded 128-bit MD5 digest of the data.",
          type: "string",
          required: false,
        },
        ChecksumAlgorithm: {
          name: "Checksum Algorithm",
          description:
            "Indicates the algorithm used to create the checksum for the request when you use the SDK.",
          type: "string",
          required: false,
        },
        ReplicationConfiguration: {
          name: "Replication Configuration",
          description: "A container for replication rules.",
          type: {
            type: "object",
            properties: {
              Role: {
                type: "string",
              },
              Rules: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ID: {
                      type: "string",
                    },
                    Priority: {
                      type: "number",
                    },
                    Prefix: {
                      type: "string",
                    },
                    Filter: {
                      type: "object",
                      properties: {
                        Prefix: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Tag: {
                          type: "object",
                          additionalProperties: true,
                        },
                        And: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    Status: {
                      type: "string",
                    },
                    SourceSelectionCriteria: {
                      type: "object",
                      properties: {
                        SseKmsEncryptedObjects: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ReplicaModifications: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    ExistingObjectReplication: {
                      type: "object",
                      properties: {
                        Status: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Status"],
                      additionalProperties: false,
                    },
                    Destination: {
                      type: "object",
                      properties: {
                        Bucket: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Account: {
                          type: "object",
                          additionalProperties: true,
                        },
                        StorageClass: {
                          type: "object",
                          additionalProperties: true,
                        },
                        AccessControlTranslation: {
                          type: "object",
                          additionalProperties: true,
                        },
                        EncryptionConfiguration: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ReplicationTime: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Metrics: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Bucket"],
                      additionalProperties: false,
                    },
                    DeleteMarkerReplication: {
                      type: "object",
                      properties: {
                        Status: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Status", "Destination"],
                  additionalProperties: false,
                },
              },
            },
            required: ["Role", "Rules"],
            additionalProperties: false,
          },
          required: true,
        },
        Token: {
          name: "Token",
          description:
            "A token to allow Object Lock to be enabled for an existing bucket.",
          type: "string",
          required: false,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
          type: "string",
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

        const client = new S3Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutBucketReplicationCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Bucket Replication Result",
      description: "Result from PutBucketReplication operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default putBucketReplication;

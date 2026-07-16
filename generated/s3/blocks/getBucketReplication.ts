import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, GetBucketReplicationCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const getBucketReplication: AppBlock = {
  name: "Get Bucket Replication",
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
          description:
            "The bucket name for which to get the replication information.",
          type: "string",
          required: true,
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

        const client = new S3Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetBucketReplicationCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Bucket Replication Result",
      description: "Result from GetBucketReplication operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ReplicationConfiguration: {
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
                          type: "string",
                        },
                        Tag: {
                          type: "object",
                          properties: {
                            Key: {},
                            Value: {},
                          },
                          required: ["Key", "Value"],
                          additionalProperties: false,
                        },
                        And: {
                          type: "object",
                          properties: {
                            Prefix: {},
                            Tags: {},
                          },
                          additionalProperties: false,
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
                          properties: {
                            Status: {},
                          },
                          required: ["Status"],
                          additionalProperties: false,
                        },
                        ReplicaModifications: {
                          type: "object",
                          properties: {
                            Status: {},
                          },
                          required: ["Status"],
                          additionalProperties: false,
                        },
                      },
                      additionalProperties: false,
                    },
                    ExistingObjectReplication: {
                      type: "object",
                      properties: {
                        Status: {
                          type: "string",
                        },
                      },
                      required: ["Status"],
                      additionalProperties: false,
                    },
                    Destination: {
                      type: "object",
                      properties: {
                        Bucket: {
                          type: "string",
                        },
                        Account: {
                          type: "string",
                        },
                        StorageClass: {
                          type: "string",
                        },
                        AccessControlTranslation: {
                          type: "object",
                          properties: {
                            Owner: {},
                          },
                          required: ["Owner"],
                          additionalProperties: false,
                        },
                        EncryptionConfiguration: {
                          type: "object",
                          properties: {
                            ReplicaKmsKeyID: {},
                          },
                          additionalProperties: false,
                        },
                        ReplicationTime: {
                          type: "object",
                          properties: {
                            Status: {},
                            Time: {},
                          },
                          required: ["Status", "Time"],
                          additionalProperties: false,
                        },
                        Metrics: {
                          type: "object",
                          properties: {
                            Status: {},
                            EventThreshold: {},
                          },
                          required: ["Status"],
                          additionalProperties: false,
                        },
                      },
                      required: ["Bucket"],
                      additionalProperties: false,
                    },
                    DeleteMarkerReplication: {
                      type: "object",
                      properties: {
                        Status: {
                          type: "string",
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
            description: "A container for replication rules.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getBucketReplication;

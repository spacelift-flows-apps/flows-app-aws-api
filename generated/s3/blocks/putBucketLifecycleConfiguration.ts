import { AppBlock, events } from "@slflows/sdk/v1";
import {
  S3Client,
  PutBucketLifecycleConfigurationCommand,
} from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";
import { convertTimestamps } from "../utils/convertTimestamps";

const putBucketLifecycleConfiguration: AppBlock = {
  name: "Put Bucket Lifecycle Configuration",
  description: `Creates a new lifecycle configuration for the bucket or replaces an existing lifecycle configuration.`,
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
            "The name of the bucket for which to set the configuration.",
          type: "string",
          required: true,
        },
        ChecksumAlgorithm: {
          name: "Checksum Algorithm",
          description:
            "Indicates the algorithm used to create the checksum for the request when you use the SDK.",
          type: {
            type: "string",
            enum: [
              "CRC32",
              "CRC32C",
              "SHA1",
              "SHA256",
              "CRC64NVME",
              "SHA512",
              "MD5",
              "XXHASH64",
              "XXHASH3",
              "XXHASH128",
            ],
          },
          required: false,
        },
        LifecycleConfiguration: {
          name: "Lifecycle Configuration",
          description: "Container for lifecycle rules.",
          type: {
            type: "object",
            properties: {
              Rules: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Expiration: {
                      type: "object",
                      properties: {
                        Date: {
                          type: "string",
                        },
                        Days: {
                          type: "number",
                        },
                        ExpiredObjectDeleteMarker: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                    ID: {
                      type: "string",
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
                        ObjectSizeGreaterThan: {
                          type: "number",
                        },
                        ObjectSizeLessThan: {
                          type: "number",
                        },
                        And: {
                          type: "object",
                          properties: {
                            Prefix: {},
                            Tags: {},
                            ObjectSizeGreaterThan: {},
                            ObjectSizeLessThan: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      additionalProperties: false,
                    },
                    Status: {
                      type: "string",
                      enum: ["Enabled", "Disabled"],
                    },
                    Transitions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Date: {},
                          Days: {},
                          StorageClass: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    NoncurrentVersionTransitions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          NoncurrentDays: {},
                          StorageClass: {},
                          NewerNoncurrentVersions: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    NoncurrentVersionExpiration: {
                      type: "object",
                      properties: {
                        NoncurrentDays: {
                          type: "number",
                        },
                        NewerNoncurrentVersions: {
                          type: "number",
                        },
                      },
                      additionalProperties: false,
                    },
                    AbortIncompleteMultipartUpload: {
                      type: "object",
                      properties: {
                        DaysAfterInitiation: {
                          type: "number",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Status"],
                  additionalProperties: false,
                },
              },
            },
            required: ["Rules"],
            additionalProperties: false,
          },
          required: false,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
          type: "string",
          required: false,
        },
        TransitionDefaultMinimumObjectSize: {
          name: "Transition Default Minimum Object Size",
          description:
            "Indicates which default minimum object size behavior is applied to the lifecycle configuration.",
          type: {
            type: "string",
            enum: ["varies_by_storage_class", "all_storage_classes_128K"],
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

        const client = new S3Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutBucketLifecycleConfigurationCommand(
          convertTimestamps(commandInput, new Set(["Date"])) as any,
        );
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Bucket Lifecycle Configuration Result",
      description: "Result from PutBucketLifecycleConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TransitionDefaultMinimumObjectSize: {
            type: "string",
            enum: ["varies_by_storage_class", "all_storage_classes_128K"],
            description:
              "Indicates which default minimum object size behavior is applied to the lifecycle configuration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putBucketLifecycleConfiguration;

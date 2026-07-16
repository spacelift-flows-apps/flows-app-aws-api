import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, RestoreObjectCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const restoreObject: AppBlock = {
  name: "Restore Object",
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
          description: "The bucket name containing the object to restore.",
          type: "string",
          required: true,
        },
        Key: {
          name: "Key",
          description: "Object key for which the action was initiated.",
          type: "string",
          required: true,
        },
        VersionId: {
          name: "Version Id",
          description:
            "VersionId used to reference a specific version of the object.",
          type: "string",
          required: false,
        },
        RestoreRequest: {
          name: "Restore Request",
          description: "Container for restore job parameters.",
          type: {
            type: "object",
            properties: {
              Days: {
                type: "number",
              },
              GlacierJobParameters: {
                type: "object",
                properties: {
                  Tier: {
                    type: "string",
                    enum: ["Standard", "Bulk", "Expedited"],
                  },
                },
                required: ["Tier"],
                additionalProperties: false,
              },
              Type: {
                type: "string",
                enum: ["SELECT"],
              },
              Tier: {
                type: "string",
                enum: ["Standard", "Bulk", "Expedited"],
              },
              Description: {
                type: "string",
              },
              SelectParameters: {
                type: "object",
                properties: {
                  InputSerialization: {
                    type: "object",
                    properties: {
                      CSV: {
                        type: "object",
                        properties: {
                          FileHeaderInfo: {
                            type: "string",
                            enum: ["USE", "IGNORE", "NONE"],
                          },
                          Comments: {
                            type: "string",
                          },
                          QuoteEscapeCharacter: {
                            type: "string",
                          },
                          RecordDelimiter: {
                            type: "string",
                          },
                          FieldDelimiter: {
                            type: "string",
                          },
                          QuoteCharacter: {
                            type: "string",
                          },
                          AllowQuotedRecordDelimiter: {
                            type: "boolean",
                          },
                        },
                        additionalProperties: false,
                      },
                      CompressionType: {
                        type: "string",
                        enum: ["NONE", "GZIP", "BZIP2"],
                      },
                      JSON: {
                        type: "object",
                        properties: {
                          Type: {
                            type: "string",
                            enum: ["DOCUMENT", "LINES"],
                          },
                        },
                        additionalProperties: false,
                      },
                      Parquet: {
                        type: "object",
                        properties: {},
                        additionalProperties: false,
                      },
                    },
                    additionalProperties: false,
                  },
                  ExpressionType: {
                    type: "string",
                    enum: ["SQL"],
                  },
                  Expression: {
                    type: "string",
                  },
                  OutputSerialization: {
                    type: "object",
                    properties: {
                      CSV: {
                        type: "object",
                        properties: {
                          QuoteFields: {
                            type: "string",
                            enum: ["ALWAYS", "ASNEEDED"],
                          },
                          QuoteEscapeCharacter: {
                            type: "string",
                          },
                          RecordDelimiter: {
                            type: "string",
                          },
                          FieldDelimiter: {
                            type: "string",
                          },
                          QuoteCharacter: {
                            type: "string",
                          },
                        },
                        additionalProperties: false,
                      },
                      JSON: {
                        type: "object",
                        properties: {
                          RecordDelimiter: {
                            type: "string",
                          },
                        },
                        additionalProperties: false,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                required: [
                  "InputSerialization",
                  "ExpressionType",
                  "Expression",
                  "OutputSerialization",
                ],
                additionalProperties: false,
              },
              OutputLocation: {
                type: "object",
                properties: {
                  S3: {
                    type: "object",
                    properties: {
                      BucketName: {
                        type: "string",
                      },
                      Prefix: {
                        type: "string",
                      },
                      Encryption: {
                        type: "object",
                        properties: {
                          EncryptionType: {
                            type: "string",
                            enum: [
                              "AES256",
                              "aws:fsx",
                              "aws:kms",
                              "aws:kms:dsse",
                            ],
                          },
                          KMSKeyId: {
                            type: "string",
                          },
                          KMSContext: {
                            type: "string",
                          },
                        },
                        required: ["EncryptionType"],
                        additionalProperties: false,
                      },
                      CannedACL: {
                        type: "string",
                        enum: [
                          "private",
                          "public-read",
                          "public-read-write",
                          "authenticated-read",
                          "aws-exec-read",
                          "bucket-owner-read",
                          "bucket-owner-full-control",
                        ],
                      },
                      AccessControlList: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            Grantee: {},
                            Permission: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      Tagging: {
                        type: "object",
                        properties: {
                          TagSet: {
                            type: "array",
                            items: {},
                          },
                        },
                        required: ["TagSet"],
                        additionalProperties: false,
                      },
                      UserMetadata: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            Name: {},
                            Value: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      StorageClass: {
                        type: "string",
                        enum: [
                          "STANDARD",
                          "REDUCED_REDUNDANCY",
                          "STANDARD_IA",
                          "ONEZONE_IA",
                          "INTELLIGENT_TIERING",
                          "GLACIER",
                          "DEEP_ARCHIVE",
                          "OUTPOSTS",
                          "GLACIER_IR",
                          "SNOW",
                          "EXPRESS_ONEZONE",
                          "FSX_OPENZFS",
                          "FSX_ONTAP",
                        ],
                      },
                    },
                    required: ["BucketName", "Prefix"],
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        RequestPayer: {
          name: "Request Payer",
          description:
            "Confirms that the requester knows that they will be charged for the request.",
          type: {
            type: "string",
            enum: ["requester"],
          },
          required: false,
        },
        ChecksumAlgorithm: {
          name: "Checksum Algorithm",
          description:
            "Indicates the algorithm used to create the checksum for the object when you use the SDK.",
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

        const command = new RestoreObjectCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Restore Object Result",
      description: "Result from RestoreObject operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RequestCharged: {
            type: "string",
            enum: ["requester"],
            description:
              "If present, indicates that the requester was successfully charged for the request.",
          },
          RestoreOutputPath: {
            type: "string",
            description:
              "Indicates the path in the provided S3 output location where Select results will be restored to.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default restoreObject;

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
                  },
                },
                required: ["Tier"],
                additionalProperties: false,
              },
              Type: {
                type: "string",
              },
              Tier: {
                type: "string",
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
                            type: "object",
                            additionalProperties: true,
                          },
                          Comments: {
                            type: "object",
                            additionalProperties: true,
                          },
                          QuoteEscapeCharacter: {
                            type: "object",
                            additionalProperties: true,
                          },
                          RecordDelimiter: {
                            type: "object",
                            additionalProperties: true,
                          },
                          FieldDelimiter: {
                            type: "object",
                            additionalProperties: true,
                          },
                          QuoteCharacter: {
                            type: "object",
                            additionalProperties: true,
                          },
                          AllowQuotedRecordDelimiter: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      CompressionType: {
                        type: "string",
                      },
                      JSON: {
                        type: "object",
                        properties: {
                          Type: {
                            type: "object",
                            additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
                          },
                          QuoteEscapeCharacter: {
                            type: "object",
                            additionalProperties: true,
                          },
                          RecordDelimiter: {
                            type: "object",
                            additionalProperties: true,
                          },
                          FieldDelimiter: {
                            type: "object",
                            additionalProperties: true,
                          },
                          QuoteCharacter: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      JSON: {
                        type: "object",
                        properties: {
                          RecordDelimiter: {
                            type: "object",
                            additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
                          },
                          KMSKeyId: {
                            type: "object",
                            additionalProperties: true,
                          },
                          KMSContext: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["EncryptionType"],
                        additionalProperties: false,
                      },
                      CannedACL: {
                        type: "string",
                      },
                      AccessControlList: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      Tagging: {
                        type: "object",
                        properties: {
                          TagSet: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["TagSet"],
                        additionalProperties: false,
                      },
                      UserMetadata: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      StorageClass: {
                        type: "string",
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
          type: "string",
          required: false,
        },
        ChecksumAlgorithm: {
          name: "Checksum Algorithm",
          description:
            "Indicates the algorithm used to create the checksum for the object when you use the SDK.",
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

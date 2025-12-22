import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const completeMultipartUpload: AppBlock = {
  name: "Complete Multipart Upload",
  description: `Completes a multipart upload by assembling previously uploaded parts.`,
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
            "Name of the bucket to which the multipart upload was initiated.",
          type: "string",
          required: true,
        },
        Key: {
          name: "Key",
          description:
            "Object key for which the multipart upload was initiated.",
          type: "string",
          required: true,
        },
        MultipartUpload: {
          name: "Multipart Upload",
          description:
            "The container for the multipart upload request information.",
          type: {
            type: "object",
            properties: {
              Parts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ETag: {
                      type: "string",
                    },
                    ChecksumCRC32: {
                      type: "string",
                    },
                    ChecksumCRC32C: {
                      type: "string",
                    },
                    ChecksumCRC64NVME: {
                      type: "string",
                    },
                    ChecksumSHA1: {
                      type: "string",
                    },
                    ChecksumSHA256: {
                      type: "string",
                    },
                    PartNumber: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        UploadId: {
          name: "Upload Id",
          description: "ID for the initiated multipart upload.",
          type: "string",
          required: true,
        },
        ChecksumCRC32: {
          name: "Checksum CRC32",
          description:
            "This header can be used as a data integrity check to verify that the data received is the same data that was originally sent.",
          type: "string",
          required: false,
        },
        ChecksumCRC32C: {
          name: "Checksum CRC32C",
          description:
            "This header can be used as a data integrity check to verify that the data received is the same data that was originally sent.",
          type: "string",
          required: false,
        },
        ChecksumCRC64NVME: {
          name: "Checksum CRC64NVME",
          description:
            "This header can be used as a data integrity check to verify that the data received is the same data that was originally sent.",
          type: "string",
          required: false,
        },
        ChecksumSHA1: {
          name: "Checksum SHA1",
          description:
            "This header can be used as a data integrity check to verify that the data received is the same data that was originally sent.",
          type: "string",
          required: false,
        },
        ChecksumSHA256: {
          name: "Checksum SHA256",
          description:
            "This header can be used as a data integrity check to verify that the data received is the same data that was originally sent.",
          type: "string",
          required: false,
        },
        ChecksumType: {
          name: "Checksum Type",
          description:
            "This header specifies the checksum type of the object, which determines how part-level checksums are combined to create an object-level checksum for multipart objects.",
          type: "string",
          required: false,
        },
        MpuObjectSize: {
          name: "Mpu Object Size",
          description:
            "The expected total object size of the multipart upload request.",
          type: "number",
          required: false,
        },
        RequestPayer: {
          name: "Request Payer",
          description:
            "Confirms that the requester knows that they will be charged for the request.",
          type: "string",
          required: false,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
          type: "string",
          required: false,
        },
        IfMatch: {
          name: "If Match",
          description:
            "Uploads the object only if the ETag (entity tag) value provided during the WRITE operation matches the ETag of the object in S3.",
          type: "string",
          required: false,
        },
        IfNoneMatch: {
          name: "If None Match",
          description:
            "Uploads the object only if the object key name does not already exist in the bucket specified.",
          type: "string",
          required: false,
        },
        SSECustomerAlgorithm: {
          name: "SSE Customer Algorithm",
          description:
            "The server-side encryption (SSE) algorithm used to encrypt the object.",
          type: "string",
          required: false,
        },
        SSECustomerKey: {
          name: "SSE Customer Key",
          description: "The server-side encryption (SSE) customer managed key.",
          type: "string",
          required: false,
        },
        SSECustomerKeyMD5: {
          name: "SSE Customer Key MD5",
          description:
            "The MD5 server-side encryption (SSE) customer managed key.",
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

        const client = new S3Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CompleteMultipartUploadCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Complete Multipart Upload Result",
      description: "Result from CompleteMultipartUpload operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Location: {
            type: "string",
            description: "The URI that identifies the newly created object.",
          },
          Bucket: {
            type: "string",
            description:
              "The name of the bucket that contains the newly created object.",
          },
          Key: {
            type: "string",
            description: "The object key of the newly created object.",
          },
          Expiration: {
            type: "string",
            description:
              "If the object expiration is configured, this will contain the expiration date (expiry-date) and rule ID (rule-id).",
          },
          ETag: {
            type: "string",
            description:
              "Entity tag that identifies the newly created object's data.",
          },
          ChecksumCRC32: {
            type: "string",
            description:
              "The Base64 encoded, 32-bit CRC32 checksum of the object.",
          },
          ChecksumCRC32C: {
            type: "string",
            description:
              "The Base64 encoded, 32-bit CRC32C checksum of the object.",
          },
          ChecksumCRC64NVME: {
            type: "string",
            description:
              "This header can be used as a data integrity check to verify that the data received is the same data that was originally sent.",
          },
          ChecksumSHA1: {
            type: "string",
            description:
              "The Base64 encoded, 160-bit SHA1 digest of the object.",
          },
          ChecksumSHA256: {
            type: "string",
            description:
              "The Base64 encoded, 256-bit SHA256 digest of the object.",
          },
          ChecksumType: {
            type: "string",
            description:
              "The checksum type, which determines how part-level checksums are combined to create an object-level checksum for multipart objects.",
          },
          ServerSideEncryption: {
            type: "string",
            description:
              "The server-side encryption algorithm used when storing this object in Amazon S3.",
          },
          VersionId: {
            type: "string",
            description:
              "Version ID of the newly created object, in case the bucket has versioning turned on.",
          },
          SSEKMSKeyId: {
            type: "string",
            description:
              "If present, indicates the ID of the KMS key that was used for object encryption.",
          },
          BucketKeyEnabled: {
            type: "boolean",
            description:
              "Indicates whether the multipart upload uses an S3 Bucket Key for server-side encryption with Key Management Service (KMS) keys (SSE-KMS).",
          },
          RequestCharged: {
            type: "string",
            description:
              "If present, indicates that the requester was successfully charged for the request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default completeMultipartUpload;

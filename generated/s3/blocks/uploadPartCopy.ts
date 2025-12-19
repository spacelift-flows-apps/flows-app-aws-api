import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, UploadPartCopyCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const uploadPartCopy: AppBlock = {
  name: "Upload Part Copy",
  description: `Uploads a part by copying data from an existing object as data source.`,
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
          description: "The bucket name.",
          type: "string",
          required: true,
        },
        CopySource: {
          name: "Copy Source",
          description: "Specifies the source object for the copy operation.",
          type: "string",
          required: true,
        },
        CopySourceIfMatch: {
          name: "Copy Source If Match",
          description:
            "Copies the object if its entity tag (ETag) matches the specified tag.",
          type: "string",
          required: false,
        },
        CopySourceIfModifiedSince: {
          name: "Copy Source If Modified Since",
          description:
            "Copies the object if it has been modified since the specified time.",
          type: "string",
          required: false,
        },
        CopySourceIfNoneMatch: {
          name: "Copy Source If None Match",
          description:
            "Copies the object if its entity tag (ETag) is different than the specified ETag.",
          type: "string",
          required: false,
        },
        CopySourceIfUnmodifiedSince: {
          name: "Copy Source If Unmodified Since",
          description:
            "Copies the object if it hasn't been modified since the specified time.",
          type: "string",
          required: false,
        },
        CopySourceRange: {
          name: "Copy Source Range",
          description: "The range of bytes to copy from the source object.",
          type: "string",
          required: false,
        },
        Key: {
          name: "Key",
          description:
            "Object key for which the multipart upload was initiated.",
          type: "string",
          required: true,
        },
        PartNumber: {
          name: "Part Number",
          description: "Part number of part being copied.",
          type: "number",
          required: true,
        },
        UploadId: {
          name: "Upload Id",
          description:
            "Upload ID identifying the multipart upload whose part is being copied.",
          type: "string",
          required: true,
        },
        SSECustomerAlgorithm: {
          name: "SSE Customer Algorithm",
          description:
            "Specifies the algorithm to use when encrypting the object (for example, AES256).",
          type: "string",
          required: false,
        },
        SSECustomerKey: {
          name: "SSE Customer Key",
          description:
            "Specifies the customer-provided encryption key for Amazon S3 to use in encrypting data.",
          type: "string",
          required: false,
        },
        SSECustomerKeyMD5: {
          name: "SSE Customer Key MD5",
          description:
            "Specifies the 128-bit MD5 digest of the encryption key according to RFC 1321.",
          type: "string",
          required: false,
        },
        CopySourceSSECustomerAlgorithm: {
          name: "Copy Source SSE Customer Algorithm",
          description:
            "Specifies the algorithm to use when decrypting the source object (for example, AES256).",
          type: "string",
          required: false,
        },
        CopySourceSSECustomerKey: {
          name: "Copy Source SSE Customer Key",
          description:
            "Specifies the customer-provided encryption key for Amazon S3 to use to decrypt the source object.",
          type: "string",
          required: false,
        },
        CopySourceSSECustomerKeyMD5: {
          name: "Copy Source SSE Customer Key MD5",
          description:
            "Specifies the 128-bit MD5 digest of the encryption key according to RFC 1321.",
          type: "string",
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
          description:
            "The account ID of the expected destination bucket owner.",
          type: "string",
          required: false,
        },
        ExpectedSourceBucketOwner: {
          name: "Expected Source Bucket Owner",
          description: "The account ID of the expected source bucket owner.",
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

        const command = new UploadPartCopyCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Upload Part Copy Result",
      description: "Result from UploadPartCopy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CopySourceVersionId: {
            type: "string",
            description:
              "The version of the source object that was copied, if you have enabled versioning on the source bucket.",
          },
          CopyPartResult: {
            type: "object",
            properties: {
              ETag: {
                type: "string",
              },
              LastModified: {
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
            },
            additionalProperties: false,
            description: "Container for all response elements.",
          },
          ServerSideEncryption: {
            type: "string",
            description:
              "The server-side encryption algorithm used when you store this object in Amazon S3 or Amazon FSx.",
          },
          SSECustomerAlgorithm: {
            type: "string",
            description:
              "If server-side encryption with a customer-provided encryption key was requested, the response will include this header to confirm the encryption algorithm that's used.",
          },
          SSECustomerKeyMD5: {
            type: "string",
            description:
              "If server-side encryption with a customer-provided encryption key was requested, the response will include this header to provide the round-trip message integrity verification of the customer-provided encryption key.",
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

export default uploadPartCopy;

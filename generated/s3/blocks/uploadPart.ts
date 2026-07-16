import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const uploadPart: AppBlock = {
  name: "Upload Part",
  description: `Uploads a part in a multipart upload.`,
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
        Body: {
          name: "Body",
          description: "Object data.",
          type: "string",
          required: false,
        },
        Bucket: {
          name: "Bucket",
          description:
            "The name of the bucket to which the multipart upload was initiated.",
          type: "string",
          required: true,
        },
        ContentLength: {
          name: "Content Length",
          description: "Size of the body in bytes.",
          type: "number",
          required: false,
        },
        ContentMD5: {
          name: "Content MD5",
          description:
            "The Base64 encoded 128-bit MD5 digest of the part data.",
          type: "string",
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
        ChecksumSHA512: {
          name: "Checksum SHA512",
          description:
            "This header can be used as a data integrity check to verify that the data received is the same data that was originally sent.",
          type: "string",
          required: false,
        },
        ChecksumMD5: {
          name: "Checksum MD5",
          description:
            "This header can be used as a data integrity check to verify that the data received is the same data that was originally sent.",
          type: "string",
          required: false,
        },
        ChecksumXXHASH64: {
          name: "Checksum XXHASH64",
          description:
            "This header can be used as a data integrity check to verify that the data received is the same data that was originally sent.",
          type: "string",
          required: false,
        },
        ChecksumXXHASH3: {
          name: "Checksum XXHASH3",
          description:
            "This header can be used as a data integrity check to verify that the data received is the same data that was originally sent.",
          type: "string",
          required: false,
        },
        ChecksumXXHASH128: {
          name: "Checksum XXHASH128",
          description:
            "This header can be used as a data integrity check to verify that the data received is the same data that was originally sent.",
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
          description: "Part number of part being uploaded.",
          type: "number",
          required: true,
        },
        UploadId: {
          name: "Upload Id",
          description:
            "Upload ID identifying the multipart upload whose part is being uploaded.",
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

        const command = new UploadPartCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Upload Part Result",
      description: "Result from UploadPart operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ServerSideEncryption: {
            type: "string",
            enum: ["AES256", "aws:fsx", "aws:kms", "aws:kms:dsse"],
            description:
              "The server-side encryption algorithm used when you store this object in Amazon S3 or Amazon FSx.",
          },
          ETag: {
            type: "string",
            description: "Entity tag for the uploaded object.",
          },
          ChecksumCRC32: {
            type: "string",
            description:
              "The Base64 encoded, 32-bit CRC32 checksum of the part.",
          },
          ChecksumCRC32C: {
            type: "string",
            description:
              "The Base64 encoded, 32-bit CRC32C checksum of the part.",
          },
          ChecksumCRC64NVME: {
            type: "string",
            description:
              "The Base64 encoded, 64-bit CRC64NVME checksum of the part.",
          },
          ChecksumSHA1: {
            type: "string",
            description:
              "The Base64 encoded, 160-bit SHA1 checksum of the part.",
          },
          ChecksumSHA256: {
            type: "string",
            description:
              "The Base64 encoded, 256-bit SHA256 checksum of the part.",
          },
          ChecksumSHA512: {
            type: "string",
            description:
              "The Base64 encoded, 512-bit SHA512 checksum of the part.",
          },
          ChecksumMD5: {
            type: "string",
            description:
              "The Base64 encoded, 128-bit MD5 checksum of the part.",
          },
          ChecksumXXHASH64: {
            type: "string",
            description:
              "The Base64 encoded, 64-bit XXHASH64 checksum of the part.",
          },
          ChecksumXXHASH3: {
            type: "string",
            description:
              "The Base64 encoded, 64-bit XXHASH3 checksum of the part.",
          },
          ChecksumXXHASH128: {
            type: "string",
            description:
              "The Base64 encoded, 128-bit XXHASH128 checksum of the part.",
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
            enum: ["requester"],
            description:
              "If present, indicates that the requester was successfully charged for the request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default uploadPart;

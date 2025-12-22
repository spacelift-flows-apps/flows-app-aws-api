import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const putObject: AppBlock = {
  name: "Put Object",
  description: `End of support notice: Beginning October 1, 2025, Amazon S3 will discontinue support for creating new Email Grantee Access Control Lists (ACL).`,
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
        ACL: {
          name: "ACL",
          description: "The canned ACL to apply to the object.",
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
          description: "The bucket name to which the PUT action was initiated.",
          type: "string",
          required: true,
        },
        CacheControl: {
          name: "Cache Control",
          description:
            "Can be used to specify caching behavior along the request/reply chain.",
          type: "string",
          required: false,
        },
        ContentDisposition: {
          name: "Content Disposition",
          description: "Specifies presentational information for the object.",
          type: "string",
          required: false,
        },
        ContentEncoding: {
          name: "Content Encoding",
          description:
            "Specifies what content encodings have been applied to the object and thus what decoding mechanisms must be applied to obtain the media-type referenced by the Content-Type header field.",
          type: "string",
          required: false,
        },
        ContentLanguage: {
          name: "Content Language",
          description: "The language the content is in.",
          type: "string",
          required: false,
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
            "The Base64 encoded 128-bit MD5 digest of the message (without the headers) according to RFC 1864.",
          type: "string",
          required: false,
        },
        ContentType: {
          name: "Content Type",
          description:
            "A standard MIME type describing the format of the contents.",
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
        Expires: {
          name: "Expires",
          description:
            "The date and time at which the object is no longer cacheable.",
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
        GrantFullControl: {
          name: "Grant Full Control",
          description:
            "Gives the grantee READ, READ_ACP, and WRITE_ACP permissions on the object.",
          type: "string",
          required: false,
        },
        GrantRead: {
          name: "Grant Read",
          description:
            "Allows grantee to read the object data and its metadata.",
          type: "string",
          required: false,
        },
        GrantReadACP: {
          name: "Grant Read ACP",
          description: "Allows grantee to read the object ACL.",
          type: "string",
          required: false,
        },
        GrantWriteACP: {
          name: "Grant Write ACP",
          description:
            "Allows grantee to write the ACL for the applicable object.",
          type: "string",
          required: false,
        },
        Key: {
          name: "Key",
          description: "Object key for which the PUT action was initiated.",
          type: "string",
          required: true,
        },
        WriteOffsetBytes: {
          name: "Write Offset Bytes",
          description:
            "Specifies the offset for appending data to existing objects in bytes.",
          type: "number",
          required: false,
        },
        Metadata: {
          name: "Metadata",
          description: "A map of metadata to store with the object in S3.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        ServerSideEncryption: {
          name: "Server Side Encryption",
          description:
            "The server-side encryption algorithm that was used when you store this object in Amazon S3 or Amazon FSx.",
          type: "string",
          required: false,
        },
        StorageClass: {
          name: "Storage Class",
          description:
            "By default, Amazon S3 uses the STANDARD Storage Class to store newly created objects.",
          type: "string",
          required: false,
        },
        WebsiteRedirectLocation: {
          name: "Website Redirect Location",
          description:
            "If the bucket is configured as a website, redirects requests for this object to another object in the same bucket or to an external URL.",
          type: "string",
          required: false,
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
        SSEKMSKeyId: {
          name: "SSEKMS Key Id",
          description:
            "Specifies the KMS key ID (Key ID, Key ARN, or Key Alias) to use for object encryption.",
          type: "string",
          required: false,
        },
        SSEKMSEncryptionContext: {
          name: "SSEKMS Encryption Context",
          description:
            "Specifies the Amazon Web Services KMS Encryption Context as an additional encryption context to use for object encryption.",
          type: "string",
          required: false,
        },
        BucketKeyEnabled: {
          name: "Bucket Key Enabled",
          description:
            "Specifies whether Amazon S3 should use an S3 Bucket Key for object encryption with server-side encryption using Key Management Service (KMS) keys (SSE-KMS).",
          type: "boolean",
          required: false,
        },
        RequestPayer: {
          name: "Request Payer",
          description:
            "Confirms that the requester knows that they will be charged for the request.",
          type: "string",
          required: false,
        },
        Tagging: {
          name: "Tagging",
          description: "The tag-set for the object.",
          type: "string",
          required: false,
        },
        ObjectLockMode: {
          name: "Object Lock Mode",
          description:
            "The Object Lock mode that you want to apply to this object.",
          type: "string",
          required: false,
        },
        ObjectLockRetainUntilDate: {
          name: "Object Lock Retain Until Date",
          description:
            "The date and time when you want this object's Object Lock to expire.",
          type: "string",
          required: false,
        },
        ObjectLockLegalHoldStatus: {
          name: "Object Lock Legal Hold Status",
          description:
            "Specifies whether a legal hold will be applied to this object.",
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

        const command = new PutObjectCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Object Result",
      description: "Result from PutObject operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Expiration: {
            type: "string",
            description:
              "If the expiration is configured for the object (see PutBucketLifecycleConfiguration) in the Amazon S3 User Guide, the response includes this header.",
          },
          ETag: {
            type: "string",
            description: "Entity tag for the uploaded object.",
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
              "The Base64 encoded, 64-bit CRC64NVME checksum of the object.",
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
              "This header specifies the checksum type of the object, which determines how part-level checksums are combined to create an object-level checksum for multipart objects.",
          },
          ServerSideEncryption: {
            type: "string",
            description:
              "The server-side encryption algorithm used when you store this object in Amazon S3 or Amazon FSx.",
          },
          VersionId: {
            type: "string",
            description: "Version ID of the object.",
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
          SSEKMSEncryptionContext: {
            type: "string",
            description:
              "If present, indicates the Amazon Web Services KMS Encryption Context to use for object encryption.",
          },
          BucketKeyEnabled: {
            type: "boolean",
            description:
              "Indicates whether the uploaded object uses an S3 Bucket Key for server-side encryption with Key Management Service (KMS) keys (SSE-KMS).",
          },
          Size: {
            type: "number",
            description: "The size of the object in bytes.",
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

export default putObject;

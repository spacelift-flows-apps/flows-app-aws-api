import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, CopyObjectCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const copyObject: AppBlock = {
  name: "Copy Object",
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
          description:
            "The canned access control list (ACL) to apply to the object.",
          type: "string",
          required: false,
        },
        Bucket: {
          name: "Bucket",
          description: "The name of the destination bucket.",
          type: "string",
          required: true,
        },
        CacheControl: {
          name: "Cache Control",
          description:
            "Specifies the caching behavior along the request/reply chain.",
          type: "string",
          required: false,
        },
        ChecksumAlgorithm: {
          name: "Checksum Algorithm",
          description:
            "Indicates the algorithm that you want Amazon S3 to use to create the checksum for the object.",
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
        ContentType: {
          name: "Content Type",
          description:
            "A standard MIME type that describes the format of the object data.",
          type: "string",
          required: false,
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
        Expires: {
          name: "Expires",
          description:
            "The date and time at which the object is no longer cacheable.",
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
          description: "The key of the destination object.",
          type: "string",
          required: true,
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
        MetadataDirective: {
          name: "Metadata Directive",
          description:
            "Specifies whether the metadata is copied from the source object or replaced with metadata that's provided in the request.",
          type: "string",
          required: false,
        },
        TaggingDirective: {
          name: "Tagging Directive",
          description:
            "Specifies whether the object tag-set is copied from the source object or replaced with the tag-set that's provided in the request.",
          type: "string",
          required: false,
        },
        ServerSideEncryption: {
          name: "Server Side Encryption",
          description:
            "The server-side encryption algorithm used when storing this object in Amazon S3.",
          type: "string",
          required: false,
        },
        StorageClass: {
          name: "Storage Class",
          description:
            "If the x-amz-storage-class header is not used, the copied object will be stored in the STANDARD Storage Class by default.",
          type: "string",
          required: false,
        },
        WebsiteRedirectLocation: {
          name: "Website Redirect Location",
          description:
            "If the destination bucket is configured as a website, redirects requests for this object copy to another object in the same bucket or to an external URL.",
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
            "Specifies the Amazon Web Services KMS Encryption Context as an additional encryption context to use for the destination object encryption.",
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
        Tagging: {
          name: "Tagging",
          description:
            "The tag-set for the object copy in the destination bucket.",
          type: "string",
          required: false,
        },
        ObjectLockMode: {
          name: "Object Lock Mode",
          description:
            "The Object Lock mode that you want to apply to the object copy.",
          type: "string",
          required: false,
        },
        ObjectLockRetainUntilDate: {
          name: "Object Lock Retain Until Date",
          description:
            "The date and time when you want the Object Lock of the object copy to expire.",
          type: "string",
          required: false,
        },
        ObjectLockLegalHoldStatus: {
          name: "Object Lock Legal Hold Status",
          description:
            "Specifies whether you want to apply a legal hold to the object copy.",
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

        const command = new CopyObjectCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Copy Object Result",
      description: "Result from CopyObject operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CopyObjectResult: {
            type: "object",
            properties: {
              ETag: {
                type: "string",
              },
              LastModified: {
                type: "string",
              },
              ChecksumType: {
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
          Expiration: {
            type: "string",
            description:
              "If the object expiration is configured, the response includes this header.",
          },
          CopySourceVersionId: {
            type: "string",
            description: "Version ID of the source object that was copied.",
          },
          VersionId: {
            type: "string",
            description: "Version ID of the newly created copy.",
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
          SSEKMSEncryptionContext: {
            type: "string",
            description:
              "If present, indicates the Amazon Web Services KMS Encryption Context to use for object encryption.",
          },
          BucketKeyEnabled: {
            type: "boolean",
            description:
              "Indicates whether the copied object uses an S3 Bucket Key for server-side encryption with Key Management Service (KMS) keys (SSE-KMS).",
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

export default copyObject;

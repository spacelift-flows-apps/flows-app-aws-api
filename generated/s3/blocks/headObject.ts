import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const headObject: AppBlock = {
  name: "Head Object",
  description: `The HEAD operation retrieves metadata from an object without returning the object itself.`,
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
          description: "The name of the bucket that contains the object.",
          type: "string",
          required: true,
        },
        IfMatch: {
          name: "If Match",
          description:
            "Return the object only if its entity tag (ETag) is the same as the one specified; otherwise, return a 412 (precondition failed) error.",
          type: "string",
          required: false,
        },
        IfModifiedSince: {
          name: "If Modified Since",
          description:
            "Return the object only if it has been modified since the specified time; otherwise, return a 304 (not modified) error.",
          type: "string",
          required: false,
        },
        IfNoneMatch: {
          name: "If None Match",
          description:
            "Return the object only if its entity tag (ETag) is different from the one specified; otherwise, return a 304 (not modified) error.",
          type: "string",
          required: false,
        },
        IfUnmodifiedSince: {
          name: "If Unmodified Since",
          description:
            "Return the object only if it has not been modified since the specified time; otherwise, return a 412 (precondition failed) error.",
          type: "string",
          required: false,
        },
        Key: {
          name: "Key",
          description: "The object key.",
          type: "string",
          required: true,
        },
        Range: {
          name: "Range",
          description: "HeadObject returns only the metadata for an object.",
          type: "string",
          required: false,
        },
        ResponseCacheControl: {
          name: "Response Cache Control",
          description: "Sets the Cache-Control header of the response.",
          type: "string",
          required: false,
        },
        ResponseContentDisposition: {
          name: "Response Content Disposition",
          description: "Sets the Content-Disposition header of the response.",
          type: "string",
          required: false,
        },
        ResponseContentEncoding: {
          name: "Response Content Encoding",
          description: "Sets the Content-Encoding header of the response.",
          type: "string",
          required: false,
        },
        ResponseContentLanguage: {
          name: "Response Content Language",
          description: "Sets the Content-Language header of the response.",
          type: "string",
          required: false,
        },
        ResponseContentType: {
          name: "Response Content Type",
          description: "Sets the Content-Type header of the response.",
          type: "string",
          required: false,
        },
        ResponseExpires: {
          name: "Response Expires",
          description: "Sets the Expires header of the response.",
          type: "string",
          required: false,
        },
        VersionId: {
          name: "Version Id",
          description:
            "Version ID used to reference a specific version of the object.",
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
        RequestPayer: {
          name: "Request Payer",
          description:
            "Confirms that the requester knows that they will be charged for the request.",
          type: "string",
          required: false,
        },
        PartNumber: {
          name: "Part Number",
          description: "Part number of the object being read.",
          type: "number",
          required: false,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
          type: "string",
          required: false,
        },
        ChecksumMode: {
          name: "Checksum Mode",
          description:
            "To retrieve the checksum, this parameter must be enabled.",
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

        const command = new HeadObjectCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Head Object Result",
      description: "Result from HeadObject operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DeleteMarker: {
            type: "boolean",
            description:
              "Specifies whether the object retrieved was (true) or was not (false) a Delete Marker.",
          },
          AcceptRanges: {
            type: "string",
            description: "Indicates that a range of bytes was specified.",
          },
          Expiration: {
            type: "string",
            description:
              "If the object expiration is configured (see PutBucketLifecycleConfiguration ), the response includes this header.",
          },
          Restore: {
            type: "string",
            description:
              "If the object is an archived object (an object whose storage class is GLACIER), the response includes this header if either the archive restoration is in progress (see RestoreObject or an archive copy is already restored.",
          },
          ArchiveStatus: {
            type: "string",
            description: "The archive state of the head object.",
          },
          LastModified: {
            type: "string",
            description: "Date and time when the object was last modified.",
          },
          ContentLength: {
            type: "number",
            description: "Size of the body in bytes.",
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
              "The checksum type, which determines how part-level checksums are combined to create an object-level checksum for multipart objects.",
          },
          ETag: {
            type: "string",
            description:
              "An entity tag (ETag) is an opaque identifier assigned by a web server to a specific version of a resource found at a URL.",
          },
          MissingMeta: {
            type: "number",
            description:
              "This is set to the number of metadata entries not returned in x-amz-meta headers.",
          },
          VersionId: {
            type: "string",
            description: "Version ID of the object.",
          },
          CacheControl: {
            type: "string",
            description:
              "Specifies caching behavior along the request/reply chain.",
          },
          ContentDisposition: {
            type: "string",
            description: "Specifies presentational information for the object.",
          },
          ContentEncoding: {
            type: "string",
            description:
              "Indicates what content encodings have been applied to the object and thus what decoding mechanisms must be applied to obtain the media-type referenced by the Content-Type header field.",
          },
          ContentLanguage: {
            type: "string",
            description: "The language the content is in.",
          },
          ContentType: {
            type: "string",
            description:
              "A standard MIME type describing the format of the object data.",
          },
          ContentRange: {
            type: "string",
            description:
              "The portion of the object returned in the response for a GET request.",
          },
          Expires: {
            type: "string",
            description:
              "The date and time at which the object is no longer cacheable.",
          },
          WebsiteRedirectLocation: {
            type: "string",
            description:
              "If the bucket is configured as a website, redirects requests for this object to another object in the same bucket or to an external URL.",
          },
          ServerSideEncryption: {
            type: "string",
            description:
              "The server-side encryption algorithm used when you store this object in Amazon S3 or Amazon FSx.",
          },
          Metadata: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
            description: "A map of metadata to store with the object in S3.",
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
              "Indicates whether the object uses an S3 Bucket Key for server-side encryption with Key Management Service (KMS) keys (SSE-KMS).",
          },
          StorageClass: {
            type: "string",
            description: "Provides storage class information of the object.",
          },
          RequestCharged: {
            type: "string",
            description:
              "If present, indicates that the requester was successfully charged for the request.",
          },
          ReplicationStatus: {
            type: "string",
            description:
              "Amazon S3 can return this header if your request involves a bucket that is either a source or a destination in a replication rule.",
          },
          PartsCount: {
            type: "number",
            description: "The count of parts this object has.",
          },
          TagCount: {
            type: "number",
            description:
              "The number of tags, if any, on the object, when you have the relevant permission to read object tags.",
          },
          ObjectLockMode: {
            type: "string",
            description:
              "The Object Lock mode, if any, that's in effect for this object.",
          },
          ObjectLockRetainUntilDate: {
            type: "string",
            description:
              "The date and time when the Object Lock retention period expires.",
          },
          ObjectLockLegalHoldStatus: {
            type: "string",
            description:
              "Specifies whether a legal hold is in effect for this object.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default headObject;

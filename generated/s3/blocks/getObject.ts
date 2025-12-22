import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const getObject: AppBlock = {
  name: "Get Object",
  description: `Retrieves an object from Amazon S3.`,
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
          description: "The bucket name containing the object.",
          type: "string",
          required: true,
        },
        IfMatch: {
          name: "If Match",
          description:
            "Return the object only if its entity tag (ETag) is the same as the one specified in this header; otherwise, return a 412 Precondition Failed error.",
          type: "string",
          required: false,
        },
        IfModifiedSince: {
          name: "If Modified Since",
          description:
            "Return the object only if it has been modified since the specified time; otherwise, return a 304 Not Modified error.",
          type: "string",
          required: false,
        },
        IfNoneMatch: {
          name: "If None Match",
          description:
            "Return the object only if its entity tag (ETag) is different from the one specified in this header; otherwise, return a 304 Not Modified error.",
          type: "string",
          required: false,
        },
        IfUnmodifiedSince: {
          name: "If Unmodified Since",
          description:
            "Return the object only if it has not been modified since the specified time; otherwise, return a 412 Precondition Failed error.",
          type: "string",
          required: false,
        },
        Key: {
          name: "Key",
          description: "Key of the object to get.",
          type: "string",
          required: true,
        },
        Range: {
          name: "Range",
          description: "Downloads the specified byte range of an object.",
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
            "Specifies the algorithm to use when decrypting the object (for example, AES256).",
          type: "string",
          required: false,
        },
        SSECustomerKey: {
          name: "SSE Customer Key",
          description:
            "Specifies the customer-provided encryption key that you originally provided for Amazon S3 to encrypt the data before storing it.",
          type: "string",
          required: false,
        },
        SSECustomerKeyMD5: {
          name: "SSE Customer Key MD5",
          description:
            "Specifies the 128-bit MD5 digest of the customer-provided encryption key according to RFC 1321.",
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
          description: "To retrieve the checksum, this mode must be enabled.",
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

        const command = new GetObjectCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Object Result",
      description: "Result from GetObject operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Body: {
            type: "string",
            description: "Object data.",
          },
          DeleteMarker: {
            type: "boolean",
            description:
              "Indicates whether the object retrieved was (true) or was not (false) a Delete Marker.",
          },
          AcceptRanges: {
            type: "string",
            description:
              "Indicates that a range of bytes was specified in the request.",
          },
          Expiration: {
            type: "string",
            description:
              "If the object expiration is configured (see PutBucketLifecycleConfiguration ), the response includes this header.",
          },
          Restore: {
            type: "string",
            description:
              "Provides information about object restoration action and expiration time of the restored object copy.",
          },
          LastModified: {
            type: "string",
            description: "Date and time when the object was last modified.",
          },
          ContentLength: {
            type: "number",
            description: "Size of the body in bytes.",
          },
          ETag: {
            type: "string",
            description:
              "An entity tag (ETag) is an opaque identifier assigned by a web server to a specific version of a resource found at a URL.",
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
          MissingMeta: {
            type: "number",
            description:
              "This is set to the number of metadata entries not returned in the headers that are prefixed with x-amz-meta-.",
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
          ContentRange: {
            type: "string",
            description: "The portion of the object returned in the response.",
          },
          ContentType: {
            type: "string",
            description:
              "A standard MIME type describing the format of the object data.",
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
              "Amazon S3 can return this if your request involves a bucket that is either a source or destination in a replication rule.",
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
              "The Object Lock mode that's currently in place for this object.",
          },
          ObjectLockRetainUntilDate: {
            type: "string",
            description:
              "The date and time when this object's Object Lock will expire.",
          },
          ObjectLockLegalHoldStatus: {
            type: "string",
            description:
              "Indicates whether this object has an active legal hold.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getObject;

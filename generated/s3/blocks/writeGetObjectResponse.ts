import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, WriteGetObjectResponseCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const writeGetObjectResponse: AppBlock = {
  name: "Write Get Object Response",
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
        RequestRoute: {
          name: "Request Route",
          description: "Route prefix to the HTTP URL generated.",
          type: "string",
          required: true,
        },
        RequestToken: {
          name: "Request Token",
          description:
            "A single use encrypted token that maps WriteGetObjectResponse to the end user GetObject request.",
          type: "string",
          required: true,
        },
        Body: {
          name: "Body",
          description: "The object data.",
          type: "string",
          required: false,
        },
        StatusCode: {
          name: "Status Code",
          description:
            "The integer status code for an HTTP response of a corresponding GetObject request.",
          type: "number",
          required: false,
        },
        ErrorCode: {
          name: "Error Code",
          description: "A string that uniquely identifies an error condition.",
          type: "string",
          required: false,
        },
        ErrorMessage: {
          name: "Error Message",
          description: "Contains a generic description of the error condition.",
          type: "string",
          required: false,
        },
        AcceptRanges: {
          name: "Accept Ranges",
          description: "Indicates that a range of bytes was specified.",
          type: "string",
          required: false,
        },
        CacheControl: {
          name: "Cache Control",
          description:
            "Specifies caching behavior along the request/reply chain.",
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
          description: "The size of the content body in bytes.",
          type: "number",
          required: false,
        },
        ContentRange: {
          name: "Content Range",
          description: "The portion of the object returned in the response.",
          type: "string",
          required: false,
        },
        ContentType: {
          name: "Content Type",
          description:
            "A standard MIME type describing the format of the object data.",
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
        DeleteMarker: {
          name: "Delete Marker",
          description:
            "Specifies whether an object stored in Amazon S3 is (true) or is not (false) a delete marker.",
          type: "boolean",
          required: false,
        },
        ETag: {
          name: "E Tag",
          description:
            "An opaque identifier assigned by a web server to a specific version of a resource found at a URL.",
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
        Expiration: {
          name: "Expiration",
          description:
            "If the object expiration is configured (see PUT Bucket lifecycle), the response includes this header.",
          type: "string",
          required: false,
        },
        LastModified: {
          name: "Last Modified",
          description: "The date and time that the object was last modified.",
          type: "string",
          required: false,
        },
        MissingMeta: {
          name: "Missing Meta",
          description:
            "Set to the number of metadata entries not returned in x-amz-meta headers.",
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
        ObjectLockMode: {
          name: "Object Lock Mode",
          description:
            "Indicates whether an object stored in Amazon S3 has Object Lock enabled.",
          type: "string",
          required: false,
        },
        ObjectLockLegalHoldStatus: {
          name: "Object Lock Legal Hold Status",
          description:
            "Indicates whether an object stored in Amazon S3 has an active legal hold.",
          type: "string",
          required: false,
        },
        ObjectLockRetainUntilDate: {
          name: "Object Lock Retain Until Date",
          description:
            "The date and time when Object Lock is configured to expire.",
          type: "string",
          required: false,
        },
        PartsCount: {
          name: "Parts Count",
          description: "The count of parts this object has.",
          type: "number",
          required: false,
        },
        ReplicationStatus: {
          name: "Replication Status",
          description:
            "Indicates if request involves bucket that is either a source or destination in a Replication rule.",
          type: "string",
          required: false,
        },
        RequestCharged: {
          name: "Request Charged",
          description:
            "If present, indicates that the requester was successfully charged for the request.",
          type: "string",
          required: false,
        },
        Restore: {
          name: "Restore",
          description:
            "Provides information about object restoration operation and expiration time of the restored object copy.",
          type: "string",
          required: false,
        },
        ServerSideEncryption: {
          name: "Server Side Encryption",
          description:
            "The server-side encryption algorithm used when storing requested object in Amazon S3 or Amazon FSx.",
          type: "string",
          required: false,
        },
        SSECustomerAlgorithm: {
          name: "SSE Customer Algorithm",
          description:
            "Encryption algorithm used if server-side encryption with a customer-provided encryption key was specified for object stored in Amazon S3.",
          type: "string",
          required: false,
        },
        SSEKMSKeyId: {
          name: "SSEKMS Key Id",
          description:
            "If present, specifies the ID (Key ID, Key ARN, or Key Alias) of the Amazon Web Services Key Management Service (Amazon Web Services KMS) symmetric encryption customer managed key that was used for stored in Amazon S3 object.",
          type: "string",
          required: false,
        },
        SSECustomerKeyMD5: {
          name: "SSE Customer Key MD5",
          description:
            "128-bit MD5 digest of customer-provided encryption key used in Amazon S3 to encrypt data stored in S3.",
          type: "string",
          required: false,
        },
        StorageClass: {
          name: "Storage Class",
          description: "Provides storage class information of the object.",
          type: "string",
          required: false,
        },
        TagCount: {
          name: "Tag Count",
          description: "The number of tags, if any, on the object.",
          type: "number",
          required: false,
        },
        VersionId: {
          name: "Version Id",
          description:
            "An ID used to reference a specific version of the object.",
          type: "string",
          required: false,
        },
        BucketKeyEnabled: {
          name: "Bucket Key Enabled",
          description:
            "Indicates whether the object stored in Amazon S3 uses an S3 bucket key for server-side encryption with Amazon Web Services KMS (SSE-KMS).",
          type: "boolean",
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

        const command = new WriteGetObjectResponseCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Write Get Object Response Result",
      description: "Result from WriteGetObjectResponse operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default writeGetObjectResponse;

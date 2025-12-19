import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const createMultipartUpload: AppBlock = {
  name: "Create Multipart Upload",
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
        Bucket: {
          name: "Bucket",
          description:
            "The name of the bucket where the multipart upload is initiated and where the object is uploaded.",
          type: "string",
          required: true,
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
          description: "The language that the content is in.",
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
            "Specify access permissions explicitly to give the grantee READ, READ_ACP, and WRITE_ACP permissions on the object.",
          type: "string",
          required: false,
        },
        GrantRead: {
          name: "Grant Read",
          description:
            "Specify access permissions explicitly to allow grantee to read the object data and its metadata.",
          type: "string",
          required: false,
        },
        GrantReadACP: {
          name: "Grant Read ACP",
          description:
            "Specify access permissions explicitly to allows grantee to read the object ACL.",
          type: "string",
          required: false,
        },
        GrantWriteACP: {
          name: "Grant Write ACP",
          description:
            "Specify access permissions explicitly to allows grantee to allow grantee to write the ACL for the applicable object.",
          type: "string",
          required: false,
        },
        Key: {
          name: "Key",
          description:
            "Object key for which the multipart upload is to be initiated.",
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
        ServerSideEncryption: {
          name: "Server Side Encryption",
          description:
            "The server-side encryption algorithm used when you store this object in Amazon S3 or Amazon FSx.",
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
            "Specifies the 128-bit MD5 digest of the customer-provided encryption key according to RFC 1321.",
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
            "Specifies the Amazon Web Services KMS Encryption Context to use for object encryption.",
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
            "Specifies the Object Lock mode that you want to apply to the uploaded object.",
          type: "string",
          required: false,
        },
        ObjectLockRetainUntilDate: {
          name: "Object Lock Retain Until Date",
          description:
            "Specifies the date and time when you want the Object Lock to expire.",
          type: "string",
          required: false,
        },
        ObjectLockLegalHoldStatus: {
          name: "Object Lock Legal Hold Status",
          description:
            "Specifies whether you want to apply a legal hold to the uploaded object.",
          type: "string",
          required: false,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
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
        ChecksumType: {
          name: "Checksum Type",
          description:
            "Indicates the checksum type that you want Amazon S3 to use to calculate the object’s checksum value.",
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

        const command = new CreateMultipartUploadCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Multipart Upload Result",
      description: "Result from CreateMultipartUpload operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AbortDate: {
            type: "string",
            description:
              "If the bucket has a lifecycle rule configured with an action to abort incomplete multipart uploads and the prefix in the lifecycle rule matches the object name in the request, the response includes this header.",
          },
          AbortRuleId: {
            type: "string",
            description:
              "This header is returned along with the x-amz-abort-date header.",
          },
          Bucket: {
            type: "string",
            description:
              "The name of the bucket to which the multipart upload was initiated.",
          },
          Key: {
            type: "string",
            description:
              "Object key for which the multipart upload was initiated.",
          },
          UploadId: {
            type: "string",
            description: "ID for the initiated multipart upload.",
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
              "Indicates whether the multipart upload uses an S3 Bucket Key for server-side encryption with Key Management Service (KMS) keys (SSE-KMS).",
          },
          RequestCharged: {
            type: "string",
            description:
              "If present, indicates that the requester was successfully charged for the request.",
          },
          ChecksumAlgorithm: {
            type: "string",
            description:
              "The algorithm that was used to create a checksum of the object.",
          },
          ChecksumType: {
            type: "string",
            description:
              "Indicates the checksum type that you want Amazon S3 to use to calculate the object’s checksum value.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createMultipartUpload;

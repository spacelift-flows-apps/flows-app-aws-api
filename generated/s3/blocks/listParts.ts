import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, ListPartsCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const listParts: AppBlock = {
  name: "List Parts",
  description: `End of support notice: Beginning October 1, 2025, Amazon S3 will stop returning DisplayName.`,
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
            "The name of the bucket to which the parts are being uploaded.",
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
        MaxParts: {
          name: "Max Parts",
          description: "Sets the maximum number of parts to return.",
          type: "number",
          required: false,
        },
        PartNumberMarker: {
          name: "Part Number Marker",
          description: "Specifies the part after which listing should begin.",
          type: "string",
          required: false,
        },
        UploadId: {
          name: "Upload Id",
          description:
            "Upload ID identifying the multipart upload whose parts are being listed.",
          type: "string",
          required: true,
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

        const command = new ListPartsCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Parts Result",
      description: "Result from ListParts operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AbortDate: {
            type: "string",
            description:
              "If the bucket has a lifecycle rule configured with an action to abort incomplete multipart uploads and the prefix in the lifecycle rule matches the object name in the request, then the response includes this header indicating when the initiated multipart upload will become eligible for abort operation.",
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
            description:
              "Upload ID identifying the multipart upload whose parts are being listed.",
          },
          PartNumberMarker: {
            type: "string",
            description: "Specifies the part after which listing should begin.",
          },
          NextPartNumberMarker: {
            type: "string",
            description:
              "When a list is truncated, this element specifies the last part in the list, as well as the value to use for the part-number-marker request parameter in a subsequent request.",
          },
          MaxParts: {
            type: "number",
            description:
              "Maximum number of parts that were allowed in the response.",
          },
          IsTruncated: {
            type: "boolean",
            description:
              "Indicates whether the returned list of parts is truncated.",
          },
          Parts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                PartNumber: {
                  type: "number",
                },
                LastModified: {
                  type: "string",
                },
                ETag: {
                  type: "string",
                },
                Size: {
                  type: "number",
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
            },
            description: "Container for elements related to a particular part.",
          },
          Initiator: {
            type: "object",
            properties: {
              ID: {
                type: "string",
              },
              DisplayName: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Container element that identifies who initiated the multipart upload.",
          },
          Owner: {
            type: "object",
            properties: {
              DisplayName: {
                type: "string",
              },
              ID: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Container element that identifies the object owner, after the object is created.",
          },
          StorageClass: {
            type: "string",
            description:
              "The class of storage used to store the uploaded object.",
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
              "The checksum type, which determines how part-level checksums are combined to create an object-level checksum for multipart objects.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listParts;

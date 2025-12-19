import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, GetObjectAttributesCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const getObjectAttributes: AppBlock = {
  name: "Get Object Attributes",
  description: `Retrieves all of the metadata from an object without returning the object itself.`,
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
        Key: {
          name: "Key",
          description: "The object key.",
          type: "string",
          required: true,
        },
        VersionId: {
          name: "Version Id",
          description:
            "The version ID used to reference a specific version of the object.",
          type: "string",
          required: false,
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
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
          type: "string",
          required: false,
        },
        ObjectAttributes: {
          name: "Object Attributes",
          description:
            "Specifies the fields at the root level that you want returned in the response.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
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

        const command = new GetObjectAttributesCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Object Attributes Result",
      description: "Result from GetObjectAttributes operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DeleteMarker: {
            type: "boolean",
            description:
              "Specifies whether the object retrieved was (true) or was not (false) a delete marker.",
          },
          LastModified: {
            type: "string",
            description: "Date and time when the object was last modified.",
          },
          VersionId: {
            type: "string",
            description: "The version ID of the object.",
          },
          RequestCharged: {
            type: "string",
            description:
              "If present, indicates that the requester was successfully charged for the request.",
          },
          ETag: {
            type: "string",
            description:
              "An ETag is an opaque identifier assigned by a web server to a specific version of a resource found at a URL.",
          },
          Checksum: {
            type: "object",
            properties: {
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
              ChecksumType: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The checksum or digest of the object.",
          },
          ObjectParts: {
            type: "object",
            properties: {
              TotalPartsCount: {
                type: "number",
              },
              PartNumberMarker: {
                type: "string",
              },
              NextPartNumberMarker: {
                type: "string",
              },
              MaxParts: {
                type: "number",
              },
              IsTruncated: {
                type: "boolean",
              },
              Parts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    PartNumber: {
                      type: "number",
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
              },
            },
            additionalProperties: false,
            description:
              "A collection of parts associated with a multipart upload.",
          },
          StorageClass: {
            type: "string",
            description:
              "Provides the storage class information of the object.",
          },
          ObjectSize: {
            type: "number",
            description: "The size of the object in bytes.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getObjectAttributes;

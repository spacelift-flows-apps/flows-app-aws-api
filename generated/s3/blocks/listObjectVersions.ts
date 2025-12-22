import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, ListObjectVersionsCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const listObjectVersions: AppBlock = {
  name: "List Object Versions",
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
          description: "The bucket name that contains the objects.",
          type: "string",
          required: true,
        },
        Delimiter: {
          name: "Delimiter",
          description:
            "A delimiter is a character that you specify to group keys.",
          type: "string",
          required: false,
        },
        EncodingType: {
          name: "Encoding Type",
          description:
            "Encoding type used by Amazon S3 to encode the object keys in the response.",
          type: "string",
          required: false,
        },
        KeyMarker: {
          name: "Key Marker",
          description:
            "Specifies the key to start with when listing objects in a bucket.",
          type: "string",
          required: false,
        },
        MaxKeys: {
          name: "Max Keys",
          description:
            "Sets the maximum number of keys returned in the response.",
          type: "number",
          required: false,
        },
        Prefix: {
          name: "Prefix",
          description:
            "Use this parameter to select only those keys that begin with the specified prefix.",
          type: "string",
          required: false,
        },
        VersionIdMarker: {
          name: "Version Id Marker",
          description:
            "Specifies the object version you want to start listing from.",
          type: "string",
          required: false,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
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
        OptionalObjectAttributes: {
          name: "Optional Object Attributes",
          description:
            "Specifies the optional fields that you want returned in the response.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const command = new ListObjectVersionsCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Object Versions Result",
      description: "Result from ListObjectVersions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          IsTruncated: {
            type: "boolean",
            description:
              "A flag that indicates whether Amazon S3 returned all of the results that satisfied the search criteria.",
          },
          KeyMarker: {
            type: "string",
            description: "Marks the last key returned in a truncated response.",
          },
          VersionIdMarker: {
            type: "string",
            description:
              "Marks the last version of the key returned in a truncated response.",
          },
          NextKeyMarker: {
            type: "string",
            description:
              "When the number of responses exceeds the value of MaxKeys, NextKeyMarker specifies the first key not returned that satisfies the search criteria.",
          },
          NextVersionIdMarker: {
            type: "string",
            description:
              "When the number of responses exceeds the value of MaxKeys, NextVersionIdMarker specifies the first object version not returned that satisfies the search criteria.",
          },
          Versions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ETag: {
                  type: "string",
                },
                ChecksumAlgorithm: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                ChecksumType: {
                  type: "string",
                },
                Size: {
                  type: "number",
                },
                StorageClass: {
                  type: "string",
                },
                Key: {
                  type: "string",
                },
                VersionId: {
                  type: "string",
                },
                IsLatest: {
                  type: "boolean",
                },
                LastModified: {
                  type: "string",
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
                },
                RestoreStatus: {
                  type: "object",
                  properties: {
                    IsRestoreInProgress: {
                      type: "boolean",
                    },
                    RestoreExpiryDate: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "Container for version information.",
          },
          DeleteMarkers: {
            type: "array",
            items: {
              type: "object",
              properties: {
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
                },
                Key: {
                  type: "string",
                },
                VersionId: {
                  type: "string",
                },
                IsLatest: {
                  type: "boolean",
                },
                LastModified: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Container for an object that is a delete marker.",
          },
          Name: {
            type: "string",
            description: "The bucket name.",
          },
          Prefix: {
            type: "string",
            description:
              "Selects objects that start with the value supplied by this parameter.",
          },
          Delimiter: {
            type: "string",
            description: "The delimiter grouping the included keys.",
          },
          MaxKeys: {
            type: "number",
            description: "Specifies the maximum number of objects to return.",
          },
          CommonPrefixes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Prefix: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "All of the keys rolled up into a common prefix count as a single return when calculating the number of returns.",
          },
          EncodingType: {
            type: "string",
            description:
              "Encoding type used by Amazon S3 to encode object key names in the XML response.",
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

export default listObjectVersions;

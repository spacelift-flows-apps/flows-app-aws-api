import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, ListObjectsCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const listObjects: AppBlock = {
  name: "List Objects",
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
          description: "The name of the bucket containing the objects.",
          type: "string",
          required: true,
        },
        Delimiter: {
          name: "Delimiter",
          description: "A delimiter is a character that you use to group keys.",
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
        Marker: {
          name: "Marker",
          description:
            "Marker is where you want Amazon S3 to start listing from.",
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
            "Limits the response to keys that begin with the specified prefix.",
          type: "string",
          required: false,
        },
        RequestPayer: {
          name: "Request Payer",
          description:
            "Confirms that the requester knows that she or he will be charged for the list objects request.",
          type: "string",
          required: false,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
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

        const command = new ListObjectsCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Objects Result",
      description: "Result from ListObjects operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          IsTruncated: {
            type: "boolean",
            description:
              "A flag that indicates whether Amazon S3 returned all of the results that satisfied the search criteria.",
          },
          Marker: {
            type: "string",
            description: "Indicates where in the bucket listing begins.",
          },
          NextMarker: {
            type: "string",
            description:
              "When the response is truncated (the IsTruncated element value in the response is true), you can use the key name in this field as the marker parameter in the subsequent request to get the next set of objects.",
          },
          Contents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                LastModified: {
                  type: "string",
                },
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
            description: "Metadata about each object returned.",
          },
          Name: {
            type: "string",
            description: "The bucket name.",
          },
          Prefix: {
            type: "string",
            description: "Keys that begin with the indicated prefix.",
          },
          Delimiter: {
            type: "string",
            description:
              "Causes keys that contain the same string between the prefix and the first occurrence of the delimiter to be rolled up into a single result element in the CommonPrefixes collection.",
          },
          MaxKeys: {
            type: "number",
            description:
              "The maximum number of keys returned in the response body.",
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
              "All of the keys (up to 1,000) rolled up in a common prefix count as a single return when calculating the number of returns.",
          },
          EncodingType: {
            type: "string",
            description:
              "Encoding type used by Amazon S3 to encode the object keys in the response.",
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

export default listObjects;

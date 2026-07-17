import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, UpdateObjectEncryptionCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const updateObjectEncryption: AppBlock = {
  name: "Update Object Encryption",
  description: `This operation is not supported for directory buckets or Amazon S3 on Outposts buckets.`,
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
            "The name of the general purpose bucket that contains the specified object key name.",
          type: "string",
          required: true,
        },
        Key: {
          name: "Key",
          description:
            "The key name of the object that you want to update the server-side encryption type for.",
          type: "string",
          required: true,
        },
        VersionId: {
          name: "Version Id",
          description:
            "The version ID of the object that you want to update the server-side encryption type for.",
          type: "string",
          required: false,
        },
        ObjectEncryption: {
          name: "Object Encryption",
          description:
            "The updated server-side encryption type for this object.",
          type: {
            oneOf: [
              {
                type: "object",
                properties: {
                  SSEKMS: {
                    type: "object",
                    properties: {
                      KMSKeyArn: {
                        type: "string",
                      },
                      BucketKeyEnabled: {
                        type: "boolean",
                      },
                    },
                    required: ["KMSKeyArn"],
                    additionalProperties: false,
                  },
                },
                required: ["SSEKMS"],
                additionalProperties: false,
              },
            ],
          },
          required: true,
        },
        RequestPayer: {
          name: "Request Payer",
          description:
            "Confirms that the requester knows that they will be charged for the request.",
          type: {
            type: "string",
            enum: ["requester"],
          },
          required: false,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
          type: "string",
          required: false,
        },
        ContentMD5: {
          name: "Content MD5",
          description: "The MD5 hash for the request body.",
          type: "string",
          required: false,
        },
        ChecksumAlgorithm: {
          name: "Checksum Algorithm",
          description:
            "Indicates the algorithm used to create the checksum for the object when you use an Amazon Web Services SDK.",
          type: {
            type: "string",
            enum: [
              "CRC32",
              "CRC32C",
              "SHA1",
              "SHA256",
              "CRC64NVME",
              "SHA512",
              "MD5",
              "XXHASH64",
              "XXHASH3",
              "XXHASH128",
            ],
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

        const command = new UpdateObjectEncryptionCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Object Encryption Result",
      description: "Result from UpdateObjectEncryption operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RequestCharged: {
            type: "string",
            enum: ["requester"],
            description:
              "If present, indicates that the requester was successfully charged for the request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateObjectEncryption;

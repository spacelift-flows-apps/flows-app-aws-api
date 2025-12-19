import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, PutBucketLoggingCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const putBucketLogging: AppBlock = {
  name: "Put Bucket Logging",
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
        Bucket: {
          name: "Bucket",
          description:
            "The name of the bucket for which to set the logging parameters.",
          type: "string",
          required: true,
        },
        BucketLoggingStatus: {
          name: "Bucket Logging Status",
          description: "Container for logging status information.",
          type: {
            type: "object",
            properties: {
              LoggingEnabled: {
                type: "object",
                properties: {
                  TargetBucket: {
                    type: "string",
                  },
                  TargetGrants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Grantee: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Permission: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  TargetPrefix: {
                    type: "string",
                  },
                  TargetObjectKeyFormat: {
                    type: "object",
                    properties: {
                      SimplePrefix: {
                        type: "object",
                        properties: {},
                        additionalProperties: false,
                      },
                      PartitionedPrefix: {
                        type: "object",
                        properties: {
                          PartitionDateSource: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                required: ["TargetBucket", "TargetPrefix"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: true,
        },
        ContentMD5: {
          name: "Content MD5",
          description: "The MD5 hash of the PutBucketLogging request body.",
          type: "string",
          required: false,
        },
        ChecksumAlgorithm: {
          name: "Checksum Algorithm",
          description:
            "Indicates the algorithm used to create the checksum for the request when you use the SDK.",
          type: "string",
          required: false,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
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

        const command = new PutBucketLoggingCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Bucket Logging Result",
      description: "Result from PutBucketLogging operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default putBucketLogging;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  S3Client,
  GetBucketLifecycleConfigurationCommand,
} from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const getBucketLifecycleConfiguration: AppBlock = {
  name: "Get Bucket Lifecycle Configuration",
  description: `Returns the lifecycle configuration information set on the bucket.`,
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
            "The name of the bucket for which to get the lifecycle information.",
          type: "string",
          required: true,
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

        const command = new GetBucketLifecycleConfigurationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Bucket Lifecycle Configuration Result",
      description: "Result from GetBucketLifecycleConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Rules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Expiration: {
                  type: "object",
                  properties: {
                    Date: {
                      type: "string",
                    },
                    Days: {
                      type: "number",
                    },
                    ExpiredObjectDeleteMarker: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
                ID: {
                  type: "string",
                },
                Prefix: {
                  type: "string",
                },
                Filter: {
                  type: "object",
                  properties: {
                    Prefix: {
                      type: "string",
                    },
                    Tag: {
                      type: "object",
                      properties: {
                        Key: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Value: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Key", "Value"],
                      additionalProperties: false,
                    },
                    ObjectSizeGreaterThan: {
                      type: "number",
                    },
                    ObjectSizeLessThan: {
                      type: "number",
                    },
                    And: {
                      type: "object",
                      properties: {
                        Prefix: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Tags: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ObjectSizeGreaterThan: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ObjectSizeLessThan: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                Status: {
                  type: "string",
                },
                Transitions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Date: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Days: {
                        type: "object",
                        additionalProperties: true,
                      },
                      StorageClass: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                NoncurrentVersionTransitions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      NoncurrentDays: {
                        type: "object",
                        additionalProperties: true,
                      },
                      StorageClass: {
                        type: "object",
                        additionalProperties: true,
                      },
                      NewerNoncurrentVersions: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                NoncurrentVersionExpiration: {
                  type: "object",
                  properties: {
                    NoncurrentDays: {
                      type: "number",
                    },
                    NewerNoncurrentVersions: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                AbortIncompleteMultipartUpload: {
                  type: "object",
                  properties: {
                    DaysAfterInitiation: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["Status"],
              additionalProperties: false,
            },
            description: "Container for a lifecycle rule.",
          },
          TransitionDefaultMinimumObjectSize: {
            type: "string",
            description:
              "Indicates which default minimum object size behavior is applied to the lifecycle configuration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getBucketLifecycleConfiguration;

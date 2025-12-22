import { AppBlock, events } from "@slflows/sdk/v1";
import {
  S3Client,
  PutBucketIntelligentTieringConfigurationCommand,
} from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const putBucketIntelligentTieringConfiguration: AppBlock = {
  name: "Put Bucket Intelligent Tiering Configuration",
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
        Bucket: {
          name: "Bucket",
          description:
            "The name of the Amazon S3 bucket whose configuration you want to modify or retrieve.",
          type: "string",
          required: true,
        },
        Id: {
          name: "Id",
          description:
            "The ID used to identify the S3 Intelligent-Tiering configuration.",
          type: "string",
          required: true,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
          type: "string",
          required: false,
        },
        IntelligentTieringConfiguration: {
          name: "Intelligent Tiering Configuration",
          description: "Container for S3 Intelligent-Tiering configuration.",
          type: {
            type: "object",
            properties: {
              Id: {
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
                        type: "string",
                      },
                      Value: {
                        type: "string",
                      },
                    },
                    required: ["Key", "Value"],
                    additionalProperties: false,
                  },
                  And: {
                    type: "object",
                    properties: {
                      Prefix: {
                        type: "string",
                      },
                      Tags: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
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
              Tierings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Days: {
                      type: "number",
                    },
                    AccessTier: {
                      type: "string",
                    },
                  },
                  required: ["Days", "AccessTier"],
                  additionalProperties: false,
                },
              },
            },
            required: ["Id", "Status", "Tierings"],
            additionalProperties: false,
          },
          required: true,
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

        const command = new PutBucketIntelligentTieringConfigurationCommand(
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
      name: "Put Bucket Intelligent Tiering Configuration Result",
      description:
        "Result from PutBucketIntelligentTieringConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default putBucketIntelligentTieringConfiguration;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  S3Client,
  GetBucketInventoryConfigurationCommand,
} from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const getBucketInventoryConfiguration: AppBlock = {
  name: "Get Bucket Inventory Configuration",
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
            "The name of the bucket containing the inventory configuration to retrieve.",
          type: "string",
          required: true,
        },
        Id: {
          name: "Id",
          description: "The ID used to identify the inventory configuration.",
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

        const command = new GetBucketInventoryConfigurationCommand(
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
      name: "Get Bucket Inventory Configuration Result",
      description: "Result from GetBucketInventoryConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InventoryConfiguration: {
            type: "object",
            properties: {
              Destination: {
                type: "object",
                properties: {
                  S3BucketDestination: {
                    type: "object",
                    properties: {
                      AccountId: {
                        type: "string",
                      },
                      Bucket: {
                        type: "string",
                      },
                      Format: {
                        type: "string",
                      },
                      Prefix: {
                        type: "string",
                      },
                      Encryption: {
                        type: "object",
                        properties: {
                          SSES3: {
                            type: "object",
                            additionalProperties: true,
                          },
                          SSEKMS: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                    },
                    required: ["Bucket", "Format"],
                    additionalProperties: false,
                  },
                },
                required: ["S3BucketDestination"],
                additionalProperties: false,
              },
              IsEnabled: {
                type: "boolean",
              },
              Filter: {
                type: "object",
                properties: {
                  Prefix: {
                    type: "string",
                  },
                },
                required: ["Prefix"],
                additionalProperties: false,
              },
              Id: {
                type: "string",
              },
              IncludedObjectVersions: {
                type: "string",
              },
              OptionalFields: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              Schedule: {
                type: "object",
                properties: {
                  Frequency: {
                    type: "string",
                  },
                },
                required: ["Frequency"],
                additionalProperties: false,
              },
            },
            required: [
              "Destination",
              "IsEnabled",
              "Id",
              "IncludedObjectVersions",
              "Schedule",
            ],
            additionalProperties: false,
            description: "Specifies the inventory configuration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getBucketInventoryConfiguration;

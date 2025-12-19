import { AppBlock, events } from "@slflows/sdk/v1";
import {
  S3Client,
  ListBucketInventoryConfigurationsCommand,
} from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const listBucketInventoryConfigurations: AppBlock = {
  name: "List Bucket Inventory Configurations",
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
            "The name of the bucket containing the inventory configurations to retrieve.",
          type: "string",
          required: true,
        },
        ContinuationToken: {
          name: "Continuation Token",
          description:
            "The marker used to continue an inventory configuration listing that has been truncated.",
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

        const command = new ListBucketInventoryConfigurationsCommand(
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
      name: "List Bucket Inventory Configurations Result",
      description: "Result from ListBucketInventoryConfigurations operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ContinuationToken: {
            type: "string",
            description:
              "If sent in the request, the marker that is used as a starting point for this inventory configuration list response.",
          },
          InventoryConfigurationList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Destination: {
                  type: "object",
                  properties: {
                    S3BucketDestination: {
                      type: "object",
                      properties: {
                        AccountId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Bucket: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Format: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Prefix: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Encryption: {
                          type: "object",
                          additionalProperties: true,
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
            },
            description: "The list of inventory configurations for a bucket.",
          },
          IsTruncated: {
            type: "boolean",
            description:
              "Tells whether the returned list of inventory configurations is complete.",
          },
          NextContinuationToken: {
            type: "string",
            description:
              "The marker used to continue this inventory configuration listing.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listBucketInventoryConfigurations;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  S3Client,
  ListBucketAnalyticsConfigurationsCommand,
} from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const listBucketAnalyticsConfigurations: AppBlock = {
  name: "List Bucket Analytics Configurations",
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
            "The name of the bucket from which analytics configurations are retrieved.",
          type: "string",
          required: true,
        },
        ContinuationToken: {
          name: "Continuation Token",
          description:
            "The ContinuationToken that represents a placeholder from where this request should begin.",
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

        const command = new ListBucketAnalyticsConfigurationsCommand(
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
      name: "List Bucket Analytics Configurations Result",
      description: "Result from ListBucketAnalyticsConfigurations operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          IsTruncated: {
            type: "boolean",
            description:
              "Indicates whether the returned list of analytics configurations is complete.",
          },
          ContinuationToken: {
            type: "string",
            description:
              "The marker that is used as a starting point for this analytics configuration list response.",
          },
          NextContinuationToken: {
            type: "string",
            description:
              "NextContinuationToken is sent when isTruncated is true, which indicates that there are more analytics configurations to list.",
          },
          AnalyticsConfigurationList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                Filter: {
                  type: "string",
                },
                StorageClassAnalysis: {
                  type: "object",
                  properties: {
                    DataExport: {
                      type: "object",
                      properties: {
                        OutputSchemaVersion: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Destination: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["OutputSchemaVersion", "Destination"],
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["Id", "StorageClassAnalysis"],
              additionalProperties: false,
            },
            description: "The list of analytics configurations for a bucket.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listBucketAnalyticsConfigurations;

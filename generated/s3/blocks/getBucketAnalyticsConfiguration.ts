import { AppBlock, events } from "@slflows/sdk/v1";
import {
  S3Client,
  GetBucketAnalyticsConfigurationCommand,
} from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const getBucketAnalyticsConfiguration: AppBlock = {
  name: "Get Bucket Analytics Configuration",
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
            "The name of the bucket from which an analytics configuration is retrieved.",
          type: "string",
          required: true,
        },
        Id: {
          name: "Id",
          description: "The ID that identifies the analytics configuration.",
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

        const command = new GetBucketAnalyticsConfigurationCommand(
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
      name: "Get Bucket Analytics Configuration Result",
      description: "Result from GetBucketAnalyticsConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AnalyticsConfiguration: {
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
                        type: "string",
                      },
                      Destination: {
                        type: "object",
                        properties: {
                          S3BucketDestination: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["S3BucketDestination"],
                        additionalProperties: false,
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
            description:
              "The configuration and any analyses for the analytics filter.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getBucketAnalyticsConfiguration;

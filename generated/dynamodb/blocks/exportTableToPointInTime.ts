import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  ExportTableToPointInTimeCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const exportTableToPointInTime: AppBlock = {
  name: "Export Table To Point In Time",
  description: `Exports table data to an S3 bucket.`,
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
        TableArn: {
          name: "Table Arn",
          description:
            "The Amazon Resource Name (ARN) associated with the table to export.",
          type: "string",
          required: true,
        },
        ExportTime: {
          name: "Export Time",
          description:
            "Time in the past from which to export table data, counted in seconds from the start of the Unix epoch.",
          type: "string",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "Providing a ClientToken makes the call to ExportTableToPointInTimeInput idempotent, meaning that multiple identical calls have the same effect as one single call.",
          type: "string",
          required: false,
        },
        S3Bucket: {
          name: "S3Bucket",
          description:
            "The name of the Amazon S3 bucket to export the snapshot to.",
          type: "string",
          required: true,
        },
        S3BucketOwner: {
          name: "S3Bucket Owner",
          description:
            "The ID of the Amazon Web Services account that owns the bucket the export will be stored in.",
          type: "string",
          required: false,
        },
        S3Prefix: {
          name: "S3Prefix",
          description:
            "The Amazon S3 bucket prefix to use as the file name and path of the exported snapshot.",
          type: "string",
          required: false,
        },
        S3SseAlgorithm: {
          name: "S3Sse Algorithm",
          description:
            "Type of encryption used on the bucket where export data will be stored.",
          type: "string",
          required: false,
        },
        S3SseKmsKeyId: {
          name: "S3Sse Kms Key Id",
          description:
            "The ID of the KMS managed key used to encrypt the S3 bucket where export data will be stored (if applicable).",
          type: "string",
          required: false,
        },
        ExportFormat: {
          name: "Export Format",
          description: "The format for the exported data.",
          type: "string",
          required: false,
        },
        ExportType: {
          name: "Export Type",
          description:
            "Choice of whether to execute as a full export or incremental export.",
          type: "string",
          required: false,
        },
        IncrementalExportSpecification: {
          name: "Incremental Export Specification",
          description:
            "Optional object containing the parameters specific to an incremental export.",
          type: {
            type: "object",
            properties: {
              ExportFromTime: {
                type: "string",
              },
              ExportToTime: {
                type: "string",
              },
              ExportViewType: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
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

        const client = new DynamoDBClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ExportTableToPointInTimeCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Export Table To Point In Time Result",
      description: "Result from ExportTableToPointInTime operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ExportDescription: {
            type: "object",
            properties: {
              ExportArn: {
                type: "string",
              },
              ExportStatus: {
                type: "string",
              },
              StartTime: {
                type: "string",
              },
              EndTime: {
                type: "string",
              },
              ExportManifest: {
                type: "string",
              },
              TableArn: {
                type: "string",
              },
              TableId: {
                type: "string",
              },
              ExportTime: {
                type: "string",
              },
              ClientToken: {
                type: "string",
              },
              S3Bucket: {
                type: "string",
              },
              S3BucketOwner: {
                type: "string",
              },
              S3Prefix: {
                type: "string",
              },
              S3SseAlgorithm: {
                type: "string",
              },
              S3SseKmsKeyId: {
                type: "string",
              },
              FailureCode: {
                type: "string",
              },
              FailureMessage: {
                type: "string",
              },
              ExportFormat: {
                type: "string",
              },
              BilledSizeBytes: {
                type: "number",
              },
              ItemCount: {
                type: "number",
              },
              ExportType: {
                type: "string",
              },
              IncrementalExportSpecification: {
                type: "object",
                properties: {
                  ExportFromTime: {
                    type: "string",
                  },
                  ExportToTime: {
                    type: "string",
                  },
                  ExportViewType: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "Contains a description of the table export.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default exportTableToPointInTime;

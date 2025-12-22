import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, SelectObjectContentCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const selectObjectContent: AppBlock = {
  name: "Select Object Content",
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
          description: "The S3 bucket.",
          type: "string",
          required: true,
        },
        Key: {
          name: "Key",
          description: "The object key.",
          type: "string",
          required: true,
        },
        SSECustomerAlgorithm: {
          name: "SSE Customer Algorithm",
          description:
            "The server-side encryption (SSE) algorithm used to encrypt the object.",
          type: "string",
          required: false,
        },
        SSECustomerKey: {
          name: "SSE Customer Key",
          description: "The server-side encryption (SSE) customer managed key.",
          type: "string",
          required: false,
        },
        SSECustomerKeyMD5: {
          name: "SSE Customer Key MD5",
          description:
            "The MD5 server-side encryption (SSE) customer managed key.",
          type: "string",
          required: false,
        },
        Expression: {
          name: "Expression",
          description: "The expression that is used to query the object.",
          type: "string",
          required: true,
        },
        ExpressionType: {
          name: "Expression Type",
          description:
            "The type of the provided expression (for example, SQL).",
          type: "string",
          required: true,
        },
        RequestProgress: {
          name: "Request Progress",
          description:
            "Specifies if periodic request progress information should be enabled.",
          type: {
            type: "object",
            properties: {
              Enabled: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        InputSerialization: {
          name: "Input Serialization",
          description:
            "Describes the format of the data in the object that is being queried.",
          type: {
            type: "object",
            properties: {
              CSV: {
                type: "object",
                properties: {
                  FileHeaderInfo: {
                    type: "string",
                  },
                  Comments: {
                    type: "string",
                  },
                  QuoteEscapeCharacter: {
                    type: "string",
                  },
                  RecordDelimiter: {
                    type: "string",
                  },
                  FieldDelimiter: {
                    type: "string",
                  },
                  QuoteCharacter: {
                    type: "string",
                  },
                  AllowQuotedRecordDelimiter: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              CompressionType: {
                type: "string",
              },
              JSON: {
                type: "object",
                properties: {
                  Type: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              Parquet: {
                type: "object",
                properties: {},
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: true,
        },
        OutputSerialization: {
          name: "Output Serialization",
          description:
            "Describes the format of the data that you want Amazon S3 to return in response.",
          type: {
            type: "object",
            properties: {
              CSV: {
                type: "object",
                properties: {
                  QuoteFields: {
                    type: "string",
                  },
                  QuoteEscapeCharacter: {
                    type: "string",
                  },
                  RecordDelimiter: {
                    type: "string",
                  },
                  FieldDelimiter: {
                    type: "string",
                  },
                  QuoteCharacter: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              JSON: {
                type: "object",
                properties: {
                  RecordDelimiter: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: true,
        },
        ScanRange: {
          name: "Scan Range",
          description:
            "Specifies the byte range of the object to get the records from.",
          type: {
            type: "object",
            properties: {
              Start: {
                type: "number",
              },
              End: {
                type: "number",
              },
            },
            additionalProperties: false,
          },
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

        const command = new SelectObjectContentCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Select Object Content Result",
      description: "Result from SelectObjectContent operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Payload: {
            type: "string",
            description: "The array of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default selectObjectContent;

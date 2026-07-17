import { AppBlock, events } from "@slflows/sdk/v1";
import { DynamoDBClient, ImportTableCommand } from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const importTable: AppBlock = {
  name: "Import Table",
  description: `Imports table data from an S3 bucket.`,
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
        ClientToken: {
          name: "Client Token",
          description:
            "Providing a ClientToken makes the call to ImportTableInput idempotent, meaning that multiple identical calls have the same effect as one single call.",
          type: "string",
          required: false,
        },
        S3BucketSource: {
          name: "S3Bucket Source",
          description: "The S3 bucket that provides the source for the import.",
          type: {
            type: "object",
            properties: {
              S3BucketOwner: {
                type: "string",
              },
              S3Bucket: {
                type: "string",
              },
              S3KeyPrefix: {
                type: "string",
              },
            },
            required: ["S3Bucket"],
            additionalProperties: false,
          },
          required: true,
        },
        InputFormat: {
          name: "Input Format",
          description: "The format of the source data.",
          type: {
            type: "string",
            enum: ["DYNAMODB_JSON", "ION", "CSV"],
          },
          required: true,
        },
        InputFormatOptions: {
          name: "Input Format Options",
          description:
            "Additional properties that specify how the input is formatted,",
          type: {
            type: "object",
            properties: {
              Csv: {
                type: "object",
                properties: {
                  Delimiter: {
                    type: "string",
                  },
                  HeaderList: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        InputCompressionType: {
          name: "Input Compression Type",
          description:
            "Type of compression to be used on the input coming from the imported table.",
          type: {
            type: "string",
            enum: ["GZIP", "ZSTD", "NONE"],
          },
          required: false,
        },
        TableCreationParameters: {
          name: "Table Creation Parameters",
          description: "Parameters for the table to import the data into.",
          type: {
            type: "object",
            properties: {
              TableName: {
                type: "string",
              },
              AttributeDefinitions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AttributeName: {
                      type: "string",
                    },
                    AttributeType: {
                      type: "string",
                      enum: ["S", "N", "B"],
                    },
                  },
                  required: ["AttributeName", "AttributeType"],
                  additionalProperties: false,
                },
              },
              KeySchema: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AttributeName: {
                      type: "string",
                    },
                    KeyType: {
                      type: "string",
                      enum: ["HASH", "RANGE"],
                    },
                  },
                  required: ["AttributeName", "KeyType"],
                  additionalProperties: false,
                },
              },
              BillingMode: {
                type: "string",
                enum: ["PROVISIONED", "PAY_PER_REQUEST"],
              },
              ProvisionedThroughput: {
                type: "object",
                properties: {
                  ReadCapacityUnits: {
                    type: "number",
                  },
                  WriteCapacityUnits: {
                    type: "number",
                  },
                },
                required: ["ReadCapacityUnits", "WriteCapacityUnits"],
                additionalProperties: false,
              },
              OnDemandThroughput: {
                type: "object",
                properties: {
                  MaxReadRequestUnits: {
                    type: "number",
                  },
                  MaxWriteRequestUnits: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              SSESpecification: {
                type: "object",
                properties: {
                  Enabled: {
                    type: "boolean",
                  },
                  SSEType: {
                    type: "string",
                    enum: ["AES256", "KMS"],
                  },
                  KMSMasterKeyId: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              GlobalSecondaryIndexes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    IndexName: {
                      type: "string",
                    },
                    KeySchema: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          AttributeName: {},
                          KeyType: {},
                        },
                        required: ["AttributeName", "KeyType"],
                        additionalProperties: false,
                      },
                    },
                    Projection: {
                      type: "object",
                      properties: {
                        ProjectionType: {
                          type: "string",
                          enum: ["ALL", "KEYS_ONLY", "INCLUDE"],
                        },
                        NonKeyAttributes: {
                          type: "array",
                          items: {},
                        },
                      },
                      additionalProperties: false,
                    },
                    ProvisionedThroughput: {
                      type: "object",
                      properties: {
                        ReadCapacityUnits: {
                          type: "number",
                        },
                        WriteCapacityUnits: {
                          type: "number",
                        },
                      },
                      required: ["ReadCapacityUnits", "WriteCapacityUnits"],
                      additionalProperties: false,
                    },
                    OnDemandThroughput: {
                      type: "object",
                      properties: {
                        MaxReadRequestUnits: {
                          type: "number",
                        },
                        MaxWriteRequestUnits: {
                          type: "number",
                        },
                      },
                      additionalProperties: false,
                    },
                    WarmThroughput: {
                      type: "object",
                      properties: {
                        ReadUnitsPerSecond: {
                          type: "number",
                        },
                        WriteUnitsPerSecond: {
                          type: "number",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["IndexName", "KeySchema", "Projection"],
                  additionalProperties: false,
                },
              },
            },
            required: ["TableName", "AttributeDefinitions", "KeySchema"],
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

        const client = new DynamoDBClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ImportTableCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Import Table Result",
      description: "Result from ImportTable operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ImportTableDescription: {
            type: "object",
            properties: {
              ImportArn: {
                type: "string",
              },
              ImportStatus: {
                type: "string",
                enum: [
                  "IN_PROGRESS",
                  "COMPLETED",
                  "CANCELLING",
                  "CANCELLED",
                  "FAILED",
                ],
              },
              TableArn: {
                type: "string",
              },
              TableId: {
                type: "string",
              },
              ClientToken: {
                type: "string",
              },
              S3BucketSource: {
                type: "object",
                properties: {
                  S3BucketOwner: {
                    type: "string",
                  },
                  S3Bucket: {
                    type: "string",
                  },
                  S3KeyPrefix: {
                    type: "string",
                  },
                },
                required: ["S3Bucket"],
                additionalProperties: false,
              },
              ErrorCount: {
                type: "number",
              },
              CloudWatchLogGroupArn: {
                type: "string",
              },
              InputFormat: {
                type: "string",
                enum: ["DYNAMODB_JSON", "ION", "CSV"],
              },
              InputFormatOptions: {
                type: "object",
                properties: {
                  Csv: {
                    type: "object",
                    properties: {
                      Delimiter: {
                        type: "string",
                      },
                      HeaderList: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              InputCompressionType: {
                type: "string",
                enum: ["GZIP", "ZSTD", "NONE"],
              },
              TableCreationParameters: {
                type: "object",
                properties: {
                  TableName: {
                    type: "string",
                  },
                  AttributeDefinitions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        AttributeName: {
                          type: "string",
                        },
                        AttributeType: {
                          type: "string",
                          enum: ["S", "N", "B"],
                        },
                      },
                      required: ["AttributeName", "AttributeType"],
                      additionalProperties: false,
                    },
                  },
                  KeySchema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        AttributeName: {
                          type: "string",
                        },
                        KeyType: {
                          type: "string",
                          enum: ["HASH", "RANGE"],
                        },
                      },
                      required: ["AttributeName", "KeyType"],
                      additionalProperties: false,
                    },
                  },
                  BillingMode: {
                    type: "string",
                    enum: ["PROVISIONED", "PAY_PER_REQUEST"],
                  },
                  ProvisionedThroughput: {
                    type: "object",
                    properties: {
                      ReadCapacityUnits: {
                        type: "number",
                      },
                      WriteCapacityUnits: {
                        type: "number",
                      },
                    },
                    required: ["ReadCapacityUnits", "WriteCapacityUnits"],
                    additionalProperties: false,
                  },
                  OnDemandThroughput: {
                    type: "object",
                    properties: {
                      MaxReadRequestUnits: {
                        type: "number",
                      },
                      MaxWriteRequestUnits: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  SSESpecification: {
                    type: "object",
                    properties: {
                      Enabled: {
                        type: "boolean",
                      },
                      SSEType: {
                        type: "string",
                        enum: ["AES256", "KMS"],
                      },
                      KMSMasterKeyId: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                  GlobalSecondaryIndexes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        IndexName: {
                          type: "string",
                        },
                        KeySchema: {
                          type: "array",
                          items: {},
                        },
                        Projection: {
                          type: "object",
                          properties: {
                            ProjectionType: {},
                            NonKeyAttributes: {},
                          },
                          additionalProperties: false,
                        },
                        ProvisionedThroughput: {
                          type: "object",
                          properties: {
                            ReadCapacityUnits: {},
                            WriteCapacityUnits: {},
                          },
                          required: ["ReadCapacityUnits", "WriteCapacityUnits"],
                          additionalProperties: false,
                        },
                        OnDemandThroughput: {
                          type: "object",
                          properties: {
                            MaxReadRequestUnits: {},
                            MaxWriteRequestUnits: {},
                          },
                          additionalProperties: false,
                        },
                        WarmThroughput: {
                          type: "object",
                          properties: {
                            ReadUnitsPerSecond: {},
                            WriteUnitsPerSecond: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      required: ["IndexName", "KeySchema", "Projection"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["TableName", "AttributeDefinitions", "KeySchema"],
                additionalProperties: false,
              },
              StartTime: {
                type: "string",
              },
              EndTime: {
                type: "string",
              },
              ProcessedSizeBytes: {
                type: "number",
              },
              ProcessedItemCount: {
                type: "number",
              },
              ImportedItemCount: {
                type: "number",
              },
              FailureCode: {
                type: "string",
              },
              FailureMessage: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Represents the properties of the table created for the import, and parameters of the import.",
          },
        },
        required: ["ImportTableDescription"],
      },
    },
  },
};

export default importTable;

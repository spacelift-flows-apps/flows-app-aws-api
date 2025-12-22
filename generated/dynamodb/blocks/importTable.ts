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
          type: "string",
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
          type: "string",
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
                    },
                  },
                  required: ["AttributeName", "KeyType"],
                  additionalProperties: false,
                },
              },
              BillingMode: {
                type: "string",
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
                        additionalProperties: true,
                      },
                    },
                    Projection: {
                      type: "object",
                      properties: {
                        ProjectionType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        NonKeyAttributes: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    ProvisionedThroughput: {
                      type: "object",
                      properties: {
                        ReadCapacityUnits: {
                          type: "object",
                          additionalProperties: true,
                        },
                        WriteCapacityUnits: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["ReadCapacityUnits", "WriteCapacityUnits"],
                      additionalProperties: false,
                    },
                    OnDemandThroughput: {
                      type: "object",
                      properties: {
                        MaxReadRequestUnits: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MaxWriteRequestUnits: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    WarmThroughput: {
                      type: "object",
                      properties: {
                        ReadUnitsPerSecond: {
                          type: "object",
                          additionalProperties: true,
                        },
                        WriteUnitsPerSecond: {
                          type: "object",
                          additionalProperties: true,
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
              InputCompressionType: {
                type: "string",
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
                          type: "object",
                          additionalProperties: true,
                        },
                        AttributeType: {
                          type: "object",
                          additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        KeyType: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["AttributeName", "KeyType"],
                      additionalProperties: false,
                    },
                  },
                  BillingMode: {
                    type: "string",
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
                          type: "object",
                          additionalProperties: true,
                        },
                        KeySchema: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Projection: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ProvisionedThroughput: {
                          type: "object",
                          additionalProperties: true,
                        },
                        OnDemandThroughput: {
                          type: "object",
                          additionalProperties: true,
                        },
                        WarmThroughput: {
                          type: "object",
                          additionalProperties: true,
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

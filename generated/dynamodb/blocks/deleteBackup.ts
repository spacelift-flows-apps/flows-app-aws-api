import { AppBlock, events } from "@slflows/sdk/v1";
import { DynamoDBClient, DeleteBackupCommand } from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteBackup: AppBlock = {
  name: "Delete Backup",
  description: `Deletes an existing backup of a table.`,
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
        BackupArn: {
          name: "Backup Arn",
          description: "The ARN associated with the backup.",
          type: "string",
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

        const command = new DeleteBackupCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Backup Result",
      description: "Result from DeleteBackup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BackupDescription: {
            type: "object",
            properties: {
              BackupDetails: {
                type: "object",
                properties: {
                  BackupArn: {
                    type: "string",
                  },
                  BackupName: {
                    type: "string",
                  },
                  BackupSizeBytes: {
                    type: "number",
                  },
                  BackupStatus: {
                    type: "string",
                    enum: ["CREATING", "DELETED", "AVAILABLE"],
                  },
                  BackupType: {
                    type: "string",
                    enum: ["USER", "SYSTEM", "AWS_BACKUP"],
                  },
                  BackupCreationDateTime: {
                    type: "string",
                  },
                  BackupExpiryDateTime: {
                    type: "string",
                  },
                },
                required: [
                  "BackupArn",
                  "BackupName",
                  "BackupStatus",
                  "BackupType",
                  "BackupCreationDateTime",
                ],
                additionalProperties: false,
              },
              SourceTableDetails: {
                type: "object",
                properties: {
                  TableName: {
                    type: "string",
                  },
                  TableId: {
                    type: "string",
                  },
                  TableArn: {
                    type: "string",
                  },
                  TableSizeBytes: {
                    type: "number",
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
                  TableCreationDateTime: {
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
                  ItemCount: {
                    type: "number",
                  },
                  BillingMode: {
                    type: "string",
                    enum: ["PROVISIONED", "PAY_PER_REQUEST"],
                  },
                },
                required: [
                  "TableName",
                  "TableId",
                  "KeySchema",
                  "TableCreationDateTime",
                  "ProvisionedThroughput",
                ],
                additionalProperties: false,
              },
              SourceTableFeatureDetails: {
                type: "object",
                properties: {
                  LocalSecondaryIndexes: {
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
                      },
                      additionalProperties: false,
                    },
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
                      },
                      additionalProperties: false,
                    },
                  },
                  StreamDescription: {
                    type: "object",
                    properties: {
                      StreamEnabled: {
                        type: "boolean",
                      },
                      StreamViewType: {
                        type: "string",
                        enum: [
                          "NEW_IMAGE",
                          "OLD_IMAGE",
                          "NEW_AND_OLD_IMAGES",
                          "KEYS_ONLY",
                        ],
                      },
                    },
                    required: ["StreamEnabled"],
                    additionalProperties: false,
                  },
                  TimeToLiveDescription: {
                    type: "object",
                    properties: {
                      TimeToLiveStatus: {
                        type: "string",
                        enum: ["ENABLING", "DISABLING", "ENABLED", "DISABLED"],
                      },
                      AttributeName: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                  SSEDescription: {
                    type: "object",
                    properties: {
                      Status: {
                        type: "string",
                        enum: [
                          "ENABLING",
                          "ENABLED",
                          "DISABLING",
                          "DISABLED",
                          "UPDATING",
                        ],
                      },
                      SSEType: {
                        type: "string",
                        enum: ["AES256", "KMS"],
                      },
                      KMSMasterKeyArn: {
                        type: "string",
                      },
                      InaccessibleEncryptionDateTime: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description:
              "Contains the description of the backup created for the table.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteBackup;

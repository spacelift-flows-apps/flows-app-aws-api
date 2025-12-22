import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  DescribeBackupCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeBackup: AppBlock = {
  name: "Describe Backup",
  description: `Describes an existing backup of a table.`,
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
          description:
            "The Amazon Resource Name (ARN) associated with the backup.",
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

        const command = new DescribeBackupCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Backup Result",
      description: "Result from DescribeBackup operation",
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
                  },
                  BackupType: {
                    type: "string",
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
                      },
                      SSEType: {
                        type: "string",
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

export default describeBackup;

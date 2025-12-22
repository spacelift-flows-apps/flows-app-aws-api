import { AppBlock, events } from "@slflows/sdk/v1";
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeTable: AppBlock = {
  name: "Describe Table",
  description: `Returns information about the table, including the current status of the table, when it was created, the primary key schema, and any indexes on the table.`,
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
        TableName: {
          name: "Table Name",
          description: "The name of the table to describe.",
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

        const command = new DescribeTableCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Table Result",
      description: "Result from DescribeTable operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Table: {
            type: "object",
            properties: {
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
              TableName: {
                type: "string",
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
              TableStatus: {
                type: "string",
              },
              CreationDateTime: {
                type: "string",
              },
              ProvisionedThroughput: {
                type: "object",
                properties: {
                  LastIncreaseDateTime: {
                    type: "string",
                  },
                  LastDecreaseDateTime: {
                    type: "string",
                  },
                  NumberOfDecreasesToday: {
                    type: "number",
                  },
                  ReadCapacityUnits: {
                    type: "number",
                  },
                  WriteCapacityUnits: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              TableSizeBytes: {
                type: "number",
              },
              ItemCount: {
                type: "number",
              },
              TableArn: {
                type: "string",
              },
              TableId: {
                type: "string",
              },
              BillingModeSummary: {
                type: "object",
                properties: {
                  BillingMode: {
                    type: "string",
                  },
                  LastUpdateToPayPerRequestDateTime: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
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
                    IndexSizeBytes: {
                      type: "number",
                    },
                    ItemCount: {
                      type: "number",
                    },
                    IndexArn: {
                      type: "string",
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
                    IndexStatus: {
                      type: "string",
                    },
                    Backfilling: {
                      type: "boolean",
                    },
                    ProvisionedThroughput: {
                      type: "object",
                      properties: {
                        LastIncreaseDateTime: {
                          type: "object",
                          additionalProperties: true,
                        },
                        LastDecreaseDateTime: {
                          type: "object",
                          additionalProperties: true,
                        },
                        NumberOfDecreasesToday: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ReadCapacityUnits: {
                          type: "object",
                          additionalProperties: true,
                        },
                        WriteCapacityUnits: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    IndexSizeBytes: {
                      type: "number",
                    },
                    ItemCount: {
                      type: "number",
                    },
                    IndexArn: {
                      type: "string",
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
                        Status: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              StreamSpecification: {
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
              LatestStreamLabel: {
                type: "string",
              },
              LatestStreamArn: {
                type: "string",
              },
              GlobalTableVersion: {
                type: "string",
              },
              Replicas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    RegionName: {
                      type: "string",
                    },
                    ReplicaStatus: {
                      type: "string",
                    },
                    ReplicaStatusDescription: {
                      type: "string",
                    },
                    ReplicaStatusPercentProgress: {
                      type: "string",
                    },
                    KMSMasterKeyId: {
                      type: "string",
                    },
                    ProvisionedThroughputOverride: {
                      type: "object",
                      properties: {
                        ReadCapacityUnits: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    OnDemandThroughputOverride: {
                      type: "object",
                      properties: {
                        MaxReadRequestUnits: {
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
                        Status: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    GlobalSecondaryIndexes: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    ReplicaInaccessibleDateTime: {
                      type: "string",
                    },
                    ReplicaTableClassSummary: {
                      type: "object",
                      properties: {
                        TableClass: {
                          type: "object",
                          additionalProperties: true,
                        },
                        LastUpdateDateTime: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              GlobalTableWitnesses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    RegionName: {
                      type: "string",
                    },
                    WitnessStatus: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              RestoreSummary: {
                type: "object",
                properties: {
                  SourceBackupArn: {
                    type: "string",
                  },
                  SourceTableArn: {
                    type: "string",
                  },
                  RestoreDateTime: {
                    type: "string",
                  },
                  RestoreInProgress: {
                    type: "boolean",
                  },
                },
                required: ["RestoreDateTime", "RestoreInProgress"],
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
              ArchivalSummary: {
                type: "object",
                properties: {
                  ArchivalDateTime: {
                    type: "string",
                  },
                  ArchivalReason: {
                    type: "string",
                  },
                  ArchivalBackupArn: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              TableClassSummary: {
                type: "object",
                properties: {
                  TableClass: {
                    type: "string",
                  },
                  LastUpdateDateTime: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              DeletionProtectionEnabled: {
                type: "boolean",
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
                  Status: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              MultiRegionConsistency: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The properties of the table.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeTable;

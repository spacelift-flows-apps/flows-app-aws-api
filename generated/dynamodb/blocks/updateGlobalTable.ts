import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  UpdateGlobalTableCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateGlobalTable: AppBlock = {
  name: "Update Global Table",
  description: `Adds or removes replicas in the specified global table.`,
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
        GlobalTableName: {
          name: "Global Table Name",
          description: "The global table name.",
          type: "string",
          required: true,
        },
        ReplicaUpdates: {
          name: "Replica Updates",
          description:
            "A list of Regions that should be added or removed from the global table.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Create: {
                  type: "object",
                  properties: {
                    RegionName: {
                      type: "string",
                    },
                  },
                  required: ["RegionName"],
                  additionalProperties: false,
                },
                Delete: {
                  type: "object",
                  properties: {
                    RegionName: {
                      type: "string",
                    },
                  },
                  required: ["RegionName"],
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
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

        const command = new UpdateGlobalTableCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Global Table Result",
      description: "Result from UpdateGlobalTable operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          GlobalTableDescription: {
            type: "object",
            properties: {
              ReplicationGroup: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    RegionName: {
                      type: "string",
                    },
                    ReplicaStatus: {
                      type: "string",
                      enum: [
                        "CREATING",
                        "CREATION_FAILED",
                        "UPDATING",
                        "DELETING",
                        "ACTIVE",
                        "REGION_DISABLED",
                        "INACCESSIBLE_ENCRYPTION_CREDENTIALS",
                        "ARCHIVING",
                        "ARCHIVED",
                        "REPLICATION_NOT_AUTHORIZED",
                      ],
                    },
                    ReplicaArn: {
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
                          type: "number",
                        },
                      },
                      additionalProperties: false,
                    },
                    OnDemandThroughputOverride: {
                      type: "object",
                      properties: {
                        MaxReadRequestUnits: {
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
                          enum: [
                            "CREATING",
                            "UPDATING",
                            "DELETING",
                            "ACTIVE",
                            "INACCESSIBLE_ENCRYPTION_CREDENTIALS",
                            "ARCHIVING",
                            "ARCHIVED",
                            "REPLICATION_NOT_AUTHORIZED",
                          ],
                        },
                      },
                      additionalProperties: false,
                    },
                    GlobalSecondaryIndexes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          IndexName: {},
                          ProvisionedThroughputOverride: {},
                          OnDemandThroughputOverride: {},
                          WarmThroughput: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    ReplicaInaccessibleDateTime: {
                      type: "string",
                    },
                    ReplicaTableClassSummary: {
                      type: "object",
                      properties: {
                        TableClass: {
                          type: "string",
                          enum: ["STANDARD", "STANDARD_INFREQUENT_ACCESS"],
                        },
                        LastUpdateDateTime: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                    GlobalTableSettingsReplicationMode: {
                      type: "string",
                      enum: ["ENABLED", "DISABLED", "ENABLED_WITH_OVERRIDES"],
                    },
                  },
                  additionalProperties: false,
                },
              },
              GlobalTableArn: {
                type: "string",
              },
              CreationDateTime: {
                type: "string",
              },
              GlobalTableStatus: {
                type: "string",
                enum: ["CREATING", "ACTIVE", "DELETING", "UPDATING"],
              },
              GlobalTableName: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Contains the details of the global table.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateGlobalTable;

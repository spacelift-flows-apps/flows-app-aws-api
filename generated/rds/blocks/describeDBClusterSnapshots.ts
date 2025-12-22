import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  DescribeDBClusterSnapshotsCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDBClusterSnapshots: AppBlock = {
  name: "Describe DB Cluster Snapshots",
  description: `Returns information about DB cluster snapshots.`,
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
        DBClusterIdentifier: {
          name: "DB Cluster Identifier",
          description:
            "The ID of the DB cluster to retrieve the list of DB cluster snapshots for.",
          type: "string",
          required: false,
        },
        DBClusterSnapshotIdentifier: {
          name: "DB Cluster Snapshot Identifier",
          description: "A specific DB cluster snapshot identifier to describe.",
          type: "string",
          required: false,
        },
        SnapshotType: {
          name: "Snapshot Type",
          description: "The type of DB cluster snapshots to be returned.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description:
            "A filter that specifies one or more DB cluster snapshots to describe.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["Name", "Values"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of records to include in the response.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional pagination token provided by a previous DescribeDBClusterSnapshots request.",
          type: "string",
          required: false,
        },
        IncludeShared: {
          name: "Include Shared",
          description:
            "Specifies whether to include shared manual DB cluster snapshots from other Amazon Web Services accounts that this Amazon Web Services account has been given permission to copy or restore.",
          type: "boolean",
          required: false,
        },
        IncludePublic: {
          name: "Include Public",
          description:
            "Specifies whether to include manual DB cluster snapshots that are public and can be copied or restored by any Amazon Web Services account.",
          type: "boolean",
          required: false,
        },
        DbClusterResourceId: {
          name: "Db Cluster Resource Id",
          description: "A specific DB cluster resource ID to describe.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeDBClusterSnapshotsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe DB Cluster Snapshots Result",
      description: "Result from DescribeDBClusterSnapshots operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous DescribeDBClusterSnapshots request.",
          },
          DBClusterSnapshots: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AvailabilityZones: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                DBClusterSnapshotIdentifier: {
                  type: "string",
                },
                DBClusterIdentifier: {
                  type: "string",
                },
                SnapshotCreateTime: {
                  type: "string",
                },
                Engine: {
                  type: "string",
                },
                EngineMode: {
                  type: "string",
                },
                AllocatedStorage: {
                  type: "number",
                },
                Status: {
                  type: "string",
                },
                Port: {
                  type: "number",
                },
                VpcId: {
                  type: "string",
                },
                ClusterCreateTime: {
                  type: "string",
                },
                MasterUsername: {
                  type: "string",
                },
                EngineVersion: {
                  type: "string",
                },
                LicenseModel: {
                  type: "string",
                },
                SnapshotType: {
                  type: "string",
                },
                PercentProgress: {
                  type: "number",
                },
                StorageEncrypted: {
                  type: "boolean",
                },
                KmsKeyId: {
                  type: "string",
                },
                DBClusterSnapshotArn: {
                  type: "string",
                },
                SourceDBClusterSnapshotArn: {
                  type: "string",
                },
                IAMDatabaseAuthenticationEnabled: {
                  type: "boolean",
                },
                TagList: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                DBSystemId: {
                  type: "string",
                },
                StorageType: {
                  type: "string",
                },
                DbClusterResourceId: {
                  type: "string",
                },
                StorageThroughput: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description:
              "Provides a list of DB cluster snapshots for the user.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDBClusterSnapshots;

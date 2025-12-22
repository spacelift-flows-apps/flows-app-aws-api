import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeClusterSnapshotsCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeClusterSnapshots: AppBlock = {
  name: "Describe Cluster Snapshots",
  description: `Returns one or more snapshot objects, which contain metadata about your cluster snapshots.`,
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
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description:
            "The identifier of the cluster which generated the requested snapshots.",
          type: "string",
          required: false,
        },
        SnapshotIdentifier: {
          name: "Snapshot Identifier",
          description:
            "The snapshot identifier of the snapshot about which to return information.",
          type: "string",
          required: false,
        },
        SnapshotArn: {
          name: "Snapshot Arn",
          description:
            "The Amazon Resource Name (ARN) of the snapshot associated with the message to describe cluster snapshots.",
          type: "string",
          required: false,
        },
        SnapshotType: {
          name: "Snapshot Type",
          description:
            "The type of snapshots for which you are requesting information.",
          type: "string",
          required: false,
        },
        StartTime: {
          name: "Start Time",
          description:
            "A value that requests only snapshots created at or after the specified time.",
          type: "string",
          required: false,
        },
        EndTime: {
          name: "End Time",
          description:
            "A time value that requests only snapshots created at or before the specified time.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of response records to return in each call.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional parameter that specifies the starting point to return a set of response records.",
          type: "string",
          required: false,
        },
        OwnerAccount: {
          name: "Owner Account",
          description:
            "The Amazon Web Services account used to create or copy the snapshot.",
          type: "string",
          required: false,
        },
        TagKeys: {
          name: "Tag Keys",
          description:
            "A tag key or keys for which you want to return all matching cluster snapshots that are associated with the specified key or keys.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        TagValues: {
          name: "Tag Values",
          description:
            "A tag value or values for which you want to return all matching cluster snapshots that are associated with the specified tag value or values.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ClusterExists: {
          name: "Cluster Exists",
          description:
            "A value that indicates whether to return snapshots only for an existing cluster.",
          type: "boolean",
          required: false,
        },
        SortingEntities: {
          name: "Sorting Entities",
          description: "",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Attribute: {
                  type: "string",
                },
                SortOrder: {
                  type: "string",
                },
              },
              required: ["Attribute"],
              additionalProperties: false,
            },
          },
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeClusterSnapshotsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Cluster Snapshots Result",
      description: "Result from DescribeClusterSnapshots operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "A value that indicates the starting point for the next set of response records in a subsequent request.",
          },
          Snapshots: {
            type: "array",
            items: {
              type: "object",
              properties: {
                SnapshotIdentifier: {
                  type: "string",
                },
                ClusterIdentifier: {
                  type: "string",
                },
                SnapshotCreateTime: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                Port: {
                  type: "number",
                },
                AvailabilityZone: {
                  type: "string",
                },
                ClusterCreateTime: {
                  type: "string",
                },
                MasterUsername: {
                  type: "string",
                },
                ClusterVersion: {
                  type: "string",
                },
                EngineFullVersion: {
                  type: "string",
                },
                SnapshotType: {
                  type: "string",
                },
                NodeType: {
                  type: "string",
                },
                NumberOfNodes: {
                  type: "number",
                },
                DBName: {
                  type: "string",
                },
                VpcId: {
                  type: "string",
                },
                Encrypted: {
                  type: "boolean",
                },
                KmsKeyId: {
                  type: "string",
                },
                EncryptedWithHSM: {
                  type: "boolean",
                },
                AccountsWithRestoreAccess: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      AccountId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AccountAlias: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                OwnerAccount: {
                  type: "string",
                },
                TotalBackupSizeInMegaBytes: {
                  type: "number",
                },
                ActualIncrementalBackupSizeInMegaBytes: {
                  type: "number",
                },
                BackupProgressInMegaBytes: {
                  type: "number",
                },
                CurrentBackupRateInMegaBytesPerSecond: {
                  type: "number",
                },
                EstimatedSecondsToCompletion: {
                  type: "number",
                },
                ElapsedTimeInSeconds: {
                  type: "number",
                },
                SourceRegion: {
                  type: "string",
                },
                Tags: {
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
                RestorableNodeTypes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                EnhancedVpcRouting: {
                  type: "boolean",
                },
                MaintenanceTrackName: {
                  type: "string",
                },
                ManualSnapshotRetentionPeriod: {
                  type: "number",
                },
                ManualSnapshotRemainingDays: {
                  type: "number",
                },
                SnapshotRetentionStartTime: {
                  type: "string",
                },
                MasterPasswordSecretArn: {
                  type: "string",
                },
                MasterPasswordSecretKmsKeyId: {
                  type: "string",
                },
                SnapshotArn: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of Snapshot instances.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeClusterSnapshots;

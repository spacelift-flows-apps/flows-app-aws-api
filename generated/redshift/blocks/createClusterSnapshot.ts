import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  CreateClusterSnapshotCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createClusterSnapshot: AppBlock = {
  name: "Create Cluster Snapshot",
  description: `Creates a manual snapshot of the specified cluster.`,
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
        SnapshotIdentifier: {
          name: "Snapshot Identifier",
          description:
            "A unique identifier for the snapshot that you are requesting.",
          type: "string",
          required: true,
        },
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description: "The cluster identifier for which you want a snapshot.",
          type: "string",
          required: true,
        },
        ManualSnapshotRetentionPeriod: {
          name: "Manual Snapshot Retention Period",
          description: "The number of days that a manual snapshot is retained.",
          type: "number",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "A list of tag instances.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
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

        const command = new CreateClusterSnapshotCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Cluster Snapshot Result",
      description: "Result from CreateClusterSnapshot operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Snapshot: {
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
                      type: "string",
                    },
                    AccountAlias: {
                      type: "string",
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
                      type: "string",
                    },
                    Value: {
                      type: "string",
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
            description: "Describes a snapshot.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createClusterSnapshot;

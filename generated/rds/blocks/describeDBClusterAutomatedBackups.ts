import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  DescribeDBClusterAutomatedBackupsCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDBClusterAutomatedBackups: AppBlock = {
  name: "Describe DB Cluster Automated Backups",
  description: `Displays backups for both current and deleted DB clusters.`,
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
        DbClusterResourceId: {
          name: "Db Cluster Resource Id",
          description:
            "The resource ID of the DB cluster that is the source of the automated backup.",
          type: "string",
          required: false,
        },
        DBClusterIdentifier: {
          name: "DB Cluster Identifier",
          description: "(Optional) The user-supplied DB cluster identifier.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description:
            "A filter that specifies which resources to return based on status.",
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
          description: "The pagination token provided in the previous request.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeDBClusterAutomatedBackupsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe DB Cluster Automated Backups Result",
      description: "Result from DescribeDBClusterAutomatedBackups operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "The pagination token provided in the previous request.",
          },
          DBClusterAutomatedBackups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Engine: {
                  type: "string",
                },
                VpcId: {
                  type: "string",
                },
                DBClusterAutomatedBackupsArn: {
                  type: "string",
                },
                DBClusterIdentifier: {
                  type: "string",
                },
                RestoreWindow: {
                  type: "object",
                  properties: {
                    EarliestTime: {
                      type: "string",
                    },
                    LatestTime: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                MasterUsername: {
                  type: "string",
                },
                DbClusterResourceId: {
                  type: "string",
                },
                Region: {
                  type: "string",
                },
                LicenseModel: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                IAMDatabaseAuthenticationEnabled: {
                  type: "boolean",
                },
                ClusterCreateTime: {
                  type: "string",
                },
                StorageEncrypted: {
                  type: "boolean",
                },
                AllocatedStorage: {
                  type: "number",
                },
                EngineVersion: {
                  type: "string",
                },
                DBClusterArn: {
                  type: "string",
                },
                BackupRetentionPeriod: {
                  type: "number",
                },
                EngineMode: {
                  type: "string",
                },
                AvailabilityZones: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                Port: {
                  type: "number",
                },
                KmsKeyId: {
                  type: "string",
                },
                StorageType: {
                  type: "string",
                },
                Iops: {
                  type: "number",
                },
                AwsBackupRecoveryPointArn: {
                  type: "string",
                },
                StorageThroughput: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description: "A list of DBClusterAutomatedBackup backups.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDBClusterAutomatedBackups;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  DeleteDBClusterAutomatedBackupCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteDBClusterAutomatedBackup: AppBlock = {
  name: "Delete DB Cluster Automated Backup",
  description: `Deletes automated backups using the DbClusterResourceId value of the source DB cluster or the Amazon Resource Name (ARN) of the automated backups.`,
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
            "The identifier for the source DB cluster, which can't be changed and which is unique to an Amazon Web Services Region.",
          type: "string",
          required: true,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeleteDBClusterAutomatedBackupCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete DB Cluster Automated Backup Result",
      description: "Result from DeleteDBClusterAutomatedBackup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBClusterAutomatedBackup: {
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
            description: "An automated backup of a DB cluster.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteDBClusterAutomatedBackup;

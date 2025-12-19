import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, CreateDBClusterSnapshotCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createDBClusterSnapshot: AppBlock = {
  name: "Create DB Cluster Snapshot",
  description: `Creates a snapshot of a DB cluster.`,
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
        DBClusterSnapshotIdentifier: {
          name: "DB Cluster Snapshot Identifier",
          description: "The identifier of the DB cluster snapshot.",
          type: "string",
          required: true,
        },
        DBClusterIdentifier: {
          name: "DB Cluster Identifier",
          description:
            "The identifier of the DB cluster to create a snapshot for.",
          type: "string",
          required: true,
        },
        Tags: {
          name: "Tags",
          description: "The tags to be assigned to the DB cluster snapshot.",
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

        const command = new CreateDBClusterSnapshotCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create DB Cluster Snapshot Result",
      description: "Result from CreateDBClusterSnapshot operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBClusterSnapshot: {
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
                      type: "string",
                    },
                    Value: {
                      type: "string",
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
            description:
              "Contains the details for an Amazon RDS DB cluster snapshot This data type is used as a response element in the DescribeDBClusterSnapshots action.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createDBClusterSnapshot;

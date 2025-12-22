import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, CopyDBClusterSnapshotCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const copyDBClusterSnapshot: AppBlock = {
  name: "Copy DB Cluster Snapshot",
  description: `Copies a snapshot of a DB cluster.`,
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
        SourceDBClusterSnapshotIdentifier: {
          name: "Source DB Cluster Snapshot Identifier",
          description: "The identifier of the DB cluster snapshot to copy.",
          type: "string",
          required: true,
        },
        TargetDBClusterSnapshotIdentifier: {
          name: "Target DB Cluster Snapshot Identifier",
          description:
            "The identifier of the new DB cluster snapshot to create from the source DB cluster snapshot.",
          type: "string",
          required: true,
        },
        KmsKeyId: {
          name: "Kms Key Id",
          description:
            "The Amazon Web Services KMS key identifier for an encrypted DB cluster snapshot.",
          type: "string",
          required: false,
        },
        PreSignedUrl: {
          name: "Pre Signed Url",
          description:
            "When you are copying a DB cluster snapshot from one Amazon Web Services GovCloud (US) Region to another, the URL that contains a Signature Version 4 signed request for the CopyDBClusterSnapshot API operation in the Amazon Web Services Region that contains the source DB cluster snapshot to copy.",
          type: "string",
          required: false,
        },
        CopyTags: {
          name: "Copy Tags",
          description:
            "Specifies whether to copy all tags from the source DB cluster snapshot to the target DB cluster snapshot.",
          type: "boolean",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "A list of tags.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CopyDBClusterSnapshotCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Copy DB Cluster Snapshot Result",
      description: "Result from CopyDBClusterSnapshot operation",
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

export default copyDBClusterSnapshot;

import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, DescribeDBSnapshotsCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDBSnapshots: AppBlock = {
  name: "Describe DB Snapshots",
  description: `Returns information about DB snapshots.`,
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
        DBInstanceIdentifier: {
          name: "DB Instance Identifier",
          description:
            "The ID of the DB instance to retrieve the list of DB snapshots for.",
          type: "string",
          required: false,
        },
        DBSnapshotIdentifier: {
          name: "DB Snapshot Identifier",
          description: "A specific DB snapshot identifier to describe.",
          type: "string",
          required: false,
        },
        SnapshotType: {
          name: "Snapshot Type",
          description: "The type of snapshots to be returned.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description:
            "A filter that specifies one or more DB snapshots to describe.",
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
            "An optional pagination token provided by a previous DescribeDBSnapshots request.",
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
        DbiResourceId: {
          name: "Dbi Resource Id",
          description: "A specific DB resource ID to describe.",
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

        const command = new DescribeDBSnapshotsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe DB Snapshots Result",
      description: "Result from DescribeDBSnapshots operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous request.",
          },
          DBSnapshots: {
            type: "array",
            items: {
              type: "object",
              properties: {
                DBSnapshotIdentifier: {
                  type: "string",
                },
                DBInstanceIdentifier: {
                  type: "string",
                },
                SnapshotCreateTime: {
                  type: "string",
                },
                Engine: {
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
                AvailabilityZone: {
                  type: "string",
                },
                VpcId: {
                  type: "string",
                },
                InstanceCreateTime: {
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
                Iops: {
                  type: "number",
                },
                OptionGroupName: {
                  type: "string",
                },
                PercentProgress: {
                  type: "number",
                },
                SourceRegion: {
                  type: "string",
                },
                SourceDBSnapshotIdentifier: {
                  type: "string",
                },
                StorageType: {
                  type: "string",
                },
                TdeCredentialArn: {
                  type: "string",
                },
                Encrypted: {
                  type: "boolean",
                },
                KmsKeyId: {
                  type: "string",
                },
                DBSnapshotArn: {
                  type: "string",
                },
                Timezone: {
                  type: "string",
                },
                IAMDatabaseAuthenticationEnabled: {
                  type: "boolean",
                },
                ProcessorFeatures: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Name: {
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
                DbiResourceId: {
                  type: "string",
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
                OriginalSnapshotCreateTime: {
                  type: "string",
                },
                SnapshotDatabaseTime: {
                  type: "string",
                },
                SnapshotTarget: {
                  type: "string",
                },
                StorageThroughput: {
                  type: "number",
                },
                DBSystemId: {
                  type: "string",
                },
                DedicatedLogVolume: {
                  type: "boolean",
                },
                MultiTenant: {
                  type: "boolean",
                },
                SnapshotAvailabilityZone: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of DBSnapshot instances.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDBSnapshots;

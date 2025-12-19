import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, CreateDBSnapshotCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createDBSnapshot: AppBlock = {
  name: "Create DB Snapshot",
  description: `Creates a snapshot of a DB instance.`,
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
        DBSnapshotIdentifier: {
          name: "DB Snapshot Identifier",
          description: "The identifier for the DB snapshot.",
          type: "string",
          required: true,
        },
        DBInstanceIdentifier: {
          name: "DB Instance Identifier",
          description:
            "The identifier of the DB instance that you want to create the snapshot of.",
          type: "string",
          required: true,
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

        const command = new CreateDBSnapshotCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create DB Snapshot Result",
      description: "Result from CreateDBSnapshot operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBSnapshot: {
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
                      type: "string",
                    },
                    Value: {
                      type: "string",
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
                      type: "string",
                    },
                    Value: {
                      type: "string",
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
            description: "Contains the details of an Amazon RDS DB snapshot.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createDBSnapshot;

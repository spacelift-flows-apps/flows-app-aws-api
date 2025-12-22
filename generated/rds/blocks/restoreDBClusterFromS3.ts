import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, RestoreDBClusterFromS3Command } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const restoreDBClusterFromS3: AppBlock = {
  name: "Restore DB Cluster From S3",
  description: `Creates an Amazon Aurora DB cluster from MySQL data stored in an Amazon S3 bucket.`,
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
        AvailabilityZones: {
          name: "Availability Zones",
          description:
            "A list of Availability Zones (AZs) where instances in the restored DB cluster can be created.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        BackupRetentionPeriod: {
          name: "Backup Retention Period",
          description:
            "The number of days for which automated backups of the restored DB cluster are retained.",
          type: "number",
          required: false,
        },
        CharacterSetName: {
          name: "Character Set Name",
          description:
            "A value that indicates that the restored DB cluster should be associated with the specified CharacterSet.",
          type: "string",
          required: false,
        },
        DatabaseName: {
          name: "Database Name",
          description: "The database name for the restored DB cluster.",
          type: "string",
          required: false,
        },
        DBClusterIdentifier: {
          name: "DB Cluster Identifier",
          description:
            "The name of the DB cluster to create from the source data in the Amazon S3 bucket.",
          type: "string",
          required: true,
        },
        DBClusterParameterGroupName: {
          name: "DB Cluster Parameter Group Name",
          description:
            "The name of the DB cluster parameter group to associate with the restored DB cluster.",
          type: "string",
          required: false,
        },
        VpcSecurityGroupIds: {
          name: "Vpc Security Group Ids",
          description:
            "A list of EC2 VPC security groups to associate with the restored DB cluster.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        DBSubnetGroupName: {
          name: "DB Subnet Group Name",
          description:
            "A DB subnet group to associate with the restored DB cluster.",
          type: "string",
          required: false,
        },
        Engine: {
          name: "Engine",
          description:
            "The name of the database engine to be used for this DB cluster.",
          type: "string",
          required: true,
        },
        EngineVersion: {
          name: "Engine Version",
          description: "The version number of the database engine to use.",
          type: "string",
          required: false,
        },
        Port: {
          name: "Port",
          description:
            "The port number on which the instances in the restored DB cluster accept connections.",
          type: "number",
          required: false,
        },
        MasterUsername: {
          name: "Master Username",
          description:
            "The name of the master user for the restored DB cluster.",
          type: "string",
          required: true,
        },
        MasterUserPassword: {
          name: "Master User Password",
          description: "The password for the master database user.",
          type: "string",
          required: false,
        },
        OptionGroupName: {
          name: "Option Group Name",
          description:
            "A value that indicates that the restored DB cluster should be associated with the specified option group.",
          type: "string",
          required: false,
        },
        PreferredBackupWindow: {
          name: "Preferred Backup Window",
          description:
            "The daily time range during which automated backups are created if automated backups are enabled using the BackupRetentionPeriod parameter.",
          type: "string",
          required: false,
        },
        PreferredMaintenanceWindow: {
          name: "Preferred Maintenance Window",
          description:
            "The weekly time range during which system maintenance can occur, in Universal Coordinated Time (UTC).",
          type: "string",
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
        StorageEncrypted: {
          name: "Storage Encrypted",
          description:
            "Specifies whether the restored DB cluster is encrypted.",
          type: "boolean",
          required: false,
        },
        KmsKeyId: {
          name: "Kms Key Id",
          description:
            "The Amazon Web Services KMS key identifier for an encrypted DB cluster.",
          type: "string",
          required: false,
        },
        EnableIAMDatabaseAuthentication: {
          name: "Enable IAM Database Authentication",
          description:
            "Specifies whether to enable mapping of Amazon Web Services Identity and Access Management (IAM) accounts to database accounts.",
          type: "boolean",
          required: false,
        },
        SourceEngine: {
          name: "Source Engine",
          description:
            "The identifier for the database engine that was backed up to create the files stored in the Amazon S3 bucket.",
          type: "string",
          required: true,
        },
        SourceEngineVersion: {
          name: "Source Engine Version",
          description:
            "The version of the database that the backup files were created from.",
          type: "string",
          required: true,
        },
        S3BucketName: {
          name: "S3Bucket Name",
          description:
            "The name of the Amazon S3 bucket that contains the data used to create the Amazon Aurora DB cluster.",
          type: "string",
          required: true,
        },
        S3Prefix: {
          name: "S3Prefix",
          description:
            "The prefix for all of the file names that contain the data used to create the Amazon Aurora DB cluster.",
          type: "string",
          required: false,
        },
        S3IngestionRoleArn: {
          name: "S3Ingestion Role Arn",
          description:
            "The Amazon Resource Name (ARN) of the Amazon Web Services Identity and Access Management (IAM) role that authorizes Amazon RDS to access the Amazon S3 bucket on your behalf.",
          type: "string",
          required: true,
        },
        BacktrackWindow: {
          name: "Backtrack Window",
          description: "The target backtrack window, in seconds.",
          type: "number",
          required: false,
        },
        EnableCloudwatchLogsExports: {
          name: "Enable Cloudwatch Logs Exports",
          description:
            "The list of logs that the restored DB cluster is to export to CloudWatch Logs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        DeletionProtection: {
          name: "Deletion Protection",
          description:
            "Specifies whether to enable deletion protection for the DB cluster.",
          type: "boolean",
          required: false,
        },
        CopyTagsToSnapshot: {
          name: "Copy Tags To Snapshot",
          description:
            "Specifies whether to copy all tags from the restored DB cluster to snapshots of the restored DB cluster.",
          type: "boolean",
          required: false,
        },
        Domain: {
          name: "Domain",
          description:
            "Specify the Active Directory directory ID to restore the DB cluster in.",
          type: "string",
          required: false,
        },
        DomainIAMRoleName: {
          name: "Domain IAM Role Name",
          description:
            "Specify the name of the IAM role to be used when making API calls to the Directory Service.",
          type: "string",
          required: false,
        },
        ServerlessV2ScalingConfiguration: {
          name: "Serverless V2Scaling Configuration",
          description:
            "Contains the scaling configuration of an Aurora Serverless v2 DB cluster.",
          type: {
            type: "object",
            properties: {
              MinCapacity: {
                type: "number",
              },
              MaxCapacity: {
                type: "number",
              },
              SecondsUntilAutoPause: {
                type: "number",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        NetworkType: {
          name: "Network Type",
          description: "The network type of the DB cluster.",
          type: "string",
          required: false,
        },
        ManageMasterUserPassword: {
          name: "Manage Master User Password",
          description:
            "Specifies whether to manage the master user password with Amazon Web Services Secrets Manager.",
          type: "boolean",
          required: false,
        },
        MasterUserSecretKmsKeyId: {
          name: "Master User Secret Kms Key Id",
          description:
            "The Amazon Web Services KMS key identifier to encrypt a secret that is automatically generated and managed in Amazon Web Services Secrets Manager.",
          type: "string",
          required: false,
        },
        StorageType: {
          name: "Storage Type",
          description:
            "Specifies the storage type to be associated with the DB cluster.",
          type: "string",
          required: false,
        },
        EngineLifecycleSupport: {
          name: "Engine Lifecycle Support",
          description: "The life cycle type for this DB cluster.",
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

        const command = new RestoreDBClusterFromS3Command(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Restore DB Cluster From S3 Result",
      description: "Result from RestoreDBClusterFromS3 operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBCluster: {
            type: "object",
            properties: {
              AllocatedStorage: {
                type: "number",
              },
              AvailabilityZones: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              BackupRetentionPeriod: {
                type: "number",
              },
              CharacterSetName: {
                type: "string",
              },
              DatabaseName: {
                type: "string",
              },
              DBClusterIdentifier: {
                type: "string",
              },
              DBClusterParameterGroup: {
                type: "string",
              },
              DBSubnetGroup: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              AutomaticRestartTime: {
                type: "string",
              },
              PercentProgress: {
                type: "string",
              },
              EarliestRestorableTime: {
                type: "string",
              },
              Endpoint: {
                type: "string",
              },
              ReaderEndpoint: {
                type: "string",
              },
              CustomEndpoints: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              MultiAZ: {
                type: "boolean",
              },
              Engine: {
                type: "string",
              },
              EngineVersion: {
                type: "string",
              },
              LatestRestorableTime: {
                type: "string",
              },
              Port: {
                type: "number",
              },
              MasterUsername: {
                type: "string",
              },
              DBClusterOptionGroupMemberships: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DBClusterOptionGroupName: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              PreferredBackupWindow: {
                type: "string",
              },
              PreferredMaintenanceWindow: {
                type: "string",
              },
              ReplicationSourceIdentifier: {
                type: "string",
              },
              ReadReplicaIdentifiers: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              StatusInfos: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    StatusType: {
                      type: "string",
                    },
                    Normal: {
                      type: "boolean",
                    },
                    Status: {
                      type: "string",
                    },
                    Message: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              DBClusterMembers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DBInstanceIdentifier: {
                      type: "string",
                    },
                    IsClusterWriter: {
                      type: "boolean",
                    },
                    DBClusterParameterGroupStatus: {
                      type: "string",
                    },
                    PromotionTier: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
              },
              VpcSecurityGroups: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    VpcSecurityGroupId: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              HostedZoneId: {
                type: "string",
              },
              StorageEncrypted: {
                type: "boolean",
              },
              KmsKeyId: {
                type: "string",
              },
              DbClusterResourceId: {
                type: "string",
              },
              DBClusterArn: {
                type: "string",
              },
              AssociatedRoles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    RoleArn: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                    FeatureName: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              IAMDatabaseAuthenticationEnabled: {
                type: "boolean",
              },
              CloneGroupId: {
                type: "string",
              },
              ClusterCreateTime: {
                type: "string",
              },
              EarliestBacktrackTime: {
                type: "string",
              },
              BacktrackWindow: {
                type: "number",
              },
              BacktrackConsumedChangeRecords: {
                type: "number",
              },
              EnabledCloudwatchLogsExports: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              Capacity: {
                type: "number",
              },
              EngineMode: {
                type: "string",
              },
              ScalingConfigurationInfo: {
                type: "object",
                properties: {
                  MinCapacity: {
                    type: "number",
                  },
                  MaxCapacity: {
                    type: "number",
                  },
                  AutoPause: {
                    type: "boolean",
                  },
                  SecondsUntilAutoPause: {
                    type: "number",
                  },
                  TimeoutAction: {
                    type: "string",
                  },
                  SecondsBeforeTimeout: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              RdsCustomClusterConfiguration: {
                type: "object",
                properties: {
                  InterconnectSubnetId: {
                    type: "string",
                  },
                  TransitGatewayMulticastDomainId: {
                    type: "string",
                  },
                  ReplicaMode: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              DeletionProtection: {
                type: "boolean",
              },
              HttpEndpointEnabled: {
                type: "boolean",
              },
              ActivityStreamMode: {
                type: "string",
              },
              ActivityStreamStatus: {
                type: "string",
              },
              ActivityStreamKmsKeyId: {
                type: "string",
              },
              ActivityStreamKinesisStreamName: {
                type: "string",
              },
              CopyTagsToSnapshot: {
                type: "boolean",
              },
              CrossAccountClone: {
                type: "boolean",
              },
              DomainMemberships: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Domain: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                    FQDN: {
                      type: "string",
                    },
                    IAMRoleName: {
                      type: "string",
                    },
                    OU: {
                      type: "string",
                    },
                    AuthSecretArn: {
                      type: "string",
                    },
                    DnsIps: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
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
              GlobalClusterIdentifier: {
                type: "string",
              },
              GlobalWriteForwardingStatus: {
                type: "string",
              },
              GlobalWriteForwardingRequested: {
                type: "boolean",
              },
              PendingModifiedValues: {
                type: "object",
                properties: {
                  PendingCloudwatchLogsExports: {
                    type: "object",
                    properties: {
                      LogTypesToEnable: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      LogTypesToDisable: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                  DBClusterIdentifier: {
                    type: "string",
                  },
                  MasterUserPassword: {
                    type: "string",
                  },
                  IAMDatabaseAuthenticationEnabled: {
                    type: "boolean",
                  },
                  EngineVersion: {
                    type: "string",
                  },
                  BackupRetentionPeriod: {
                    type: "number",
                  },
                  AllocatedStorage: {
                    type: "number",
                  },
                  RdsCustomClusterConfiguration: {
                    type: "object",
                    properties: {
                      InterconnectSubnetId: {
                        type: "string",
                      },
                      TransitGatewayMulticastDomainId: {
                        type: "string",
                      },
                      ReplicaMode: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                  Iops: {
                    type: "number",
                  },
                  StorageType: {
                    type: "string",
                  },
                  CertificateDetails: {
                    type: "object",
                    properties: {
                      CAIdentifier: {
                        type: "string",
                      },
                      ValidTill: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              DBClusterInstanceClass: {
                type: "string",
              },
              StorageType: {
                type: "string",
              },
              Iops: {
                type: "number",
              },
              PubliclyAccessible: {
                type: "boolean",
              },
              AutoMinorVersionUpgrade: {
                type: "boolean",
              },
              MonitoringInterval: {
                type: "number",
              },
              MonitoringRoleArn: {
                type: "string",
              },
              DatabaseInsightsMode: {
                type: "string",
              },
              PerformanceInsightsEnabled: {
                type: "boolean",
              },
              PerformanceInsightsKMSKeyId: {
                type: "string",
              },
              PerformanceInsightsRetentionPeriod: {
                type: "number",
              },
              ServerlessV2ScalingConfiguration: {
                type: "object",
                properties: {
                  MinCapacity: {
                    type: "number",
                  },
                  MaxCapacity: {
                    type: "number",
                  },
                  SecondsUntilAutoPause: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              NetworkType: {
                type: "string",
              },
              DBSystemId: {
                type: "string",
              },
              MasterUserSecret: {
                type: "object",
                properties: {
                  SecretArn: {
                    type: "string",
                  },
                  SecretStatus: {
                    type: "string",
                  },
                  KmsKeyId: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              IOOptimizedNextAllowedModificationTime: {
                type: "string",
              },
              LocalWriteForwardingStatus: {
                type: "string",
              },
              AwsBackupRecoveryPointArn: {
                type: "string",
              },
              LimitlessDatabase: {
                type: "object",
                properties: {
                  Status: {
                    type: "string",
                  },
                  MinRequiredACU: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              StorageThroughput: {
                type: "number",
              },
              ClusterScalabilityType: {
                type: "string",
              },
              CertificateDetails: {
                type: "object",
                properties: {
                  CAIdentifier: {
                    type: "string",
                  },
                  ValidTill: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              EngineLifecycleSupport: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Contains the details of an Amazon Aurora DB cluster or Multi-AZ DB cluster.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default restoreDBClusterFromS3;

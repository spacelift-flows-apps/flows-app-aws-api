import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, ModifyDBClusterCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyDBCluster: AppBlock = {
  name: "Modify DB Cluster",
  description: `Modifies the settings of an Amazon Aurora DB cluster or a Multi-AZ DB cluster.`,
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
            "The DB cluster identifier for the cluster being modified.",
          type: "string",
          required: true,
        },
        NewDBClusterIdentifier: {
          name: "New DB Cluster Identifier",
          description:
            "The new DB cluster identifier for the DB cluster when renaming a DB cluster.",
          type: "string",
          required: false,
        },
        ApplyImmediately: {
          name: "Apply Immediately",
          description:
            "Specifies whether the modifications in this request are asynchronously applied as soon as possible, regardless of the PreferredMaintenanceWindow setting for the DB cluster.",
          type: "boolean",
          required: false,
        },
        BackupRetentionPeriod: {
          name: "Backup Retention Period",
          description:
            "The number of days for which automated backups are retained.",
          type: "number",
          required: false,
        },
        DBClusterParameterGroupName: {
          name: "DB Cluster Parameter Group Name",
          description:
            "The name of the DB cluster parameter group to use for the DB cluster.",
          type: "string",
          required: false,
        },
        VpcSecurityGroupIds: {
          name: "Vpc Security Group Ids",
          description:
            "A list of EC2 VPC security groups to associate with this DB cluster.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Port: {
          name: "Port",
          description:
            "The port number on which the DB cluster accepts connections.",
          type: "number",
          required: false,
        },
        MasterUserPassword: {
          name: "Master User Password",
          description: "The new password for the master database user.",
          type: "string",
          required: false,
        },
        OptionGroupName: {
          name: "Option Group Name",
          description: "The option group to associate the DB cluster with.",
          type: "string",
          required: false,
        },
        PreferredBackupWindow: {
          name: "Preferred Backup Window",
          description:
            "The daily time range during which automated backups are created if automated backups are enabled, using the BackupRetentionPeriod parameter.",
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
        EnableIAMDatabaseAuthentication: {
          name: "Enable IAM Database Authentication",
          description:
            "Specifies whether to enable mapping of Amazon Web Services Identity and Access Management (IAM) accounts to database accounts.",
          type: "boolean",
          required: false,
        },
        BacktrackWindow: {
          name: "Backtrack Window",
          description: "The target backtrack window, in seconds.",
          type: "number",
          required: false,
        },
        CloudwatchLogsExportConfiguration: {
          name: "Cloudwatch Logs Export Configuration",
          description:
            "The configuration setting for the log types to be enabled for export to CloudWatch Logs for a specific DB cluster.",
          type: {
            type: "object",
            properties: {
              EnableLogTypes: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              DisableLogTypes: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        EngineVersion: {
          name: "Engine Version",
          description:
            "The version number of the database engine to which you want to upgrade.",
          type: "string",
          required: false,
        },
        AllowMajorVersionUpgrade: {
          name: "Allow Major Version Upgrade",
          description: "Specifies whether major version upgrades are allowed.",
          type: "boolean",
          required: false,
        },
        DBInstanceParameterGroupName: {
          name: "DB Instance Parameter Group Name",
          description:
            "The name of the DB parameter group to apply to all instances of the DB cluster.",
          type: "string",
          required: false,
        },
        Domain: {
          name: "Domain",
          description:
            "The Active Directory directory ID to move the DB cluster to.",
          type: "string",
          required: false,
        },
        DomainIAMRoleName: {
          name: "Domain IAM Role Name",
          description:
            "The name of the IAM role to use when making API calls to the Directory Service.",
          type: "string",
          required: false,
        },
        ScalingConfiguration: {
          name: "Scaling Configuration",
          description: "The scaling properties of the DB cluster.",
          type: {
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
          required: false,
        },
        DeletionProtection: {
          name: "Deletion Protection",
          description:
            "Specifies whether the DB cluster has deletion protection enabled.",
          type: "boolean",
          required: false,
        },
        EnableHttpEndpoint: {
          name: "Enable Http Endpoint",
          description:
            "Specifies whether to enable the HTTP endpoint for an Aurora Serverless v1 DB cluster.",
          type: "boolean",
          required: false,
        },
        CopyTagsToSnapshot: {
          name: "Copy Tags To Snapshot",
          description:
            "Specifies whether to copy all tags from the DB cluster to snapshots of the DB cluster.",
          type: "boolean",
          required: false,
        },
        EnableGlobalWriteForwarding: {
          name: "Enable Global Write Forwarding",
          description:
            "Specifies whether to enable this DB cluster to forward write operations to the primary cluster of a global cluster (Aurora global database).",
          type: "boolean",
          required: false,
        },
        DBClusterInstanceClass: {
          name: "DB Cluster Instance Class",
          description:
            "The compute and memory capacity of each DB instance in the Multi-AZ DB cluster, for example db.",
          type: "string",
          required: false,
        },
        AllocatedStorage: {
          name: "Allocated Storage",
          description:
            "The amount of storage in gibibytes (GiB) to allocate to each DB instance in the Multi-AZ DB cluster.",
          type: "number",
          required: false,
        },
        StorageType: {
          name: "Storage Type",
          description: "The storage type to associate with the DB cluster.",
          type: "string",
          required: false,
        },
        Iops: {
          name: "Iops",
          description:
            "The amount of Provisioned IOPS (input/output operations per second) to be initially allocated for each DB instance in the Multi-AZ DB cluster.",
          type: "number",
          required: false,
        },
        AutoMinorVersionUpgrade: {
          name: "Auto Minor Version Upgrade",
          description:
            "Specifies whether minor engine upgrades are applied automatically to the DB cluster during the maintenance window.",
          type: "boolean",
          required: false,
        },
        MonitoringInterval: {
          name: "Monitoring Interval",
          description:
            "The interval, in seconds, between points when Enhanced Monitoring metrics are collected for the DB cluster.",
          type: "number",
          required: false,
        },
        MonitoringRoleArn: {
          name: "Monitoring Role Arn",
          description:
            "The Amazon Resource Name (ARN) for the IAM role that permits RDS to send Enhanced Monitoring metrics to Amazon CloudWatch Logs.",
          type: "string",
          required: false,
        },
        DatabaseInsightsMode: {
          name: "Database Insights Mode",
          description:
            "Specifies the mode of Database Insights to enable for the DB cluster.",
          type: "string",
          required: false,
        },
        EnablePerformanceInsights: {
          name: "Enable Performance Insights",
          description:
            "Specifies whether to turn on Performance Insights for the DB cluster.",
          type: "boolean",
          required: false,
        },
        PerformanceInsightsKMSKeyId: {
          name: "Performance Insights KMS Key Id",
          description:
            "The Amazon Web Services KMS key identifier for encryption of Performance Insights data.",
          type: "string",
          required: false,
        },
        PerformanceInsightsRetentionPeriod: {
          name: "Performance Insights Retention Period",
          description:
            "The number of days to retain Performance Insights data.",
          type: "number",
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
        RotateMasterUserPassword: {
          name: "Rotate Master User Password",
          description:
            "Specifies whether to rotate the secret managed by Amazon Web Services Secrets Manager for the master user password.",
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
        EngineMode: {
          name: "Engine Mode",
          description:
            "The DB engine mode of the DB cluster, either provisioned or serverless.",
          type: "string",
          required: false,
        },
        AllowEngineModeChange: {
          name: "Allow Engine Mode Change",
          description:
            "Specifies whether engine mode changes from serverless to provisioned are allowed.",
          type: "boolean",
          required: false,
        },
        EnableLocalWriteForwarding: {
          name: "Enable Local Write Forwarding",
          description:
            "Specifies whether read replicas can forward write operations to the writer DB instance in the DB cluster.",
          type: "boolean",
          required: false,
        },
        AwsBackupRecoveryPointArn: {
          name: "Aws Backup Recovery Point Arn",
          description:
            "The Amazon Resource Name (ARN) of the recovery point in Amazon Web Services Backup.",
          type: "string",
          required: false,
        },
        EnableLimitlessDatabase: {
          name: "Enable Limitless Database",
          description: "Specifies whether to enable Aurora Limitless Database.",
          type: "boolean",
          required: false,
        },
        CACertificateIdentifier: {
          name: "CA Certificate Identifier",
          description:
            "The CA certificate identifier to use for the DB cluster's server certificate.",
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

        const command = new ModifyDBClusterCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify DB Cluster Result",
      description: "Result from ModifyDBCluster operation",
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

export default modifyDBCluster;

import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, PromoteReadReplicaCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const promoteReadReplica: AppBlock = {
  name: "Promote Read Replica",
  description: `Promotes a read replica DB instance to a standalone DB instance.`,
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
          description: "The DB instance identifier.",
          type: "string",
          required: true,
        },
        BackupRetentionPeriod: {
          name: "Backup Retention Period",
          description:
            "The number of days for which automated backups are retained.",
          type: "number",
          required: false,
        },
        PreferredBackupWindow: {
          name: "Preferred Backup Window",
          description:
            "The daily time range during which automated backups are created if automated backups are enabled, using the BackupRetentionPeriod parameter.",
          type: "string",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description:
            "Tags to assign to resources associated with the DB instance.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ResourceType: {
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

        const command = new PromoteReadReplicaCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Promote Read Replica Result",
      description: "Result from PromoteReadReplica operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBInstance: {
            type: "object",
            properties: {
              DBInstanceIdentifier: {
                type: "string",
              },
              DBInstanceClass: {
                type: "string",
              },
              Engine: {
                type: "string",
              },
              DBInstanceStatus: {
                type: "string",
              },
              MasterUsername: {
                type: "string",
              },
              DBName: {
                type: "string",
              },
              Endpoint: {
                type: "object",
                properties: {
                  Address: {
                    type: "string",
                  },
                  Port: {
                    type: "number",
                  },
                  HostedZoneId: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              AllocatedStorage: {
                type: "number",
              },
              InstanceCreateTime: {
                type: "string",
              },
              PreferredBackupWindow: {
                type: "string",
              },
              BackupRetentionPeriod: {
                type: "number",
              },
              DBSecurityGroups: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DBSecurityGroupName: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
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
              DBParameterGroups: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DBParameterGroupName: {
                      type: "string",
                    },
                    ParameterApplyStatus: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              AvailabilityZone: {
                type: "string",
              },
              DBSubnetGroup: {
                type: "object",
                properties: {
                  DBSubnetGroupName: {
                    type: "string",
                  },
                  DBSubnetGroupDescription: {
                    type: "string",
                  },
                  VpcId: {
                    type: "string",
                  },
                  SubnetGroupStatus: {
                    type: "string",
                  },
                  Subnets: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        SubnetIdentifier: {
                          type: "string",
                        },
                        SubnetAvailabilityZone: {
                          type: "object",
                          properties: {
                            Name: {},
                          },
                          additionalProperties: false,
                        },
                        SubnetOutpost: {
                          type: "object",
                          properties: {
                            Arn: {},
                          },
                          additionalProperties: false,
                        },
                        SubnetStatus: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  DBSubnetGroupArn: {
                    type: "string",
                  },
                  SupportedNetworkTypes: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                additionalProperties: false,
              },
              PreferredMaintenanceWindow: {
                type: "string",
              },
              UpgradeRolloutOrder: {
                type: "string",
                enum: ["first", "second", "last"],
              },
              PendingModifiedValues: {
                type: "object",
                properties: {
                  DBInstanceClass: {
                    type: "string",
                  },
                  AllocatedStorage: {
                    type: "number",
                  },
                  MasterUserPassword: {
                    type: "string",
                  },
                  Port: {
                    type: "number",
                  },
                  BackupRetentionPeriod: {
                    type: "number",
                  },
                  MultiAZ: {
                    type: "boolean",
                  },
                  EngineVersion: {
                    type: "string",
                  },
                  LicenseModel: {
                    type: "string",
                  },
                  Iops: {
                    type: "number",
                  },
                  StorageThroughput: {
                    type: "number",
                  },
                  DBInstanceIdentifier: {
                    type: "string",
                  },
                  StorageType: {
                    type: "string",
                  },
                  CACertificateIdentifier: {
                    type: "string",
                  },
                  DBSubnetGroupName: {
                    type: "string",
                  },
                  PendingCloudwatchLogsExports: {
                    type: "object",
                    properties: {
                      LogTypesToEnable: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                      LogTypesToDisable: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                    },
                    additionalProperties: false,
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
                  AutomationMode: {
                    type: "string",
                    enum: ["full", "all-paused"],
                  },
                  ResumeFullAutomationModeTime: {
                    type: "string",
                  },
                  MultiTenant: {
                    type: "boolean",
                  },
                  IAMDatabaseAuthenticationEnabled: {
                    type: "boolean",
                  },
                  DedicatedLogVolume: {
                    type: "boolean",
                  },
                  Engine: {
                    type: "string",
                  },
                  AdditionalStorageVolumes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        VolumeName: {
                          type: "string",
                        },
                        AllocatedStorage: {
                          type: "number",
                        },
                        IOPS: {
                          type: "number",
                        },
                        MaxAllocatedStorage: {
                          type: "number",
                        },
                        StorageThroughput: {
                          type: "number",
                        },
                        StorageType: {
                          type: "string",
                        },
                      },
                      required: ["VolumeName"],
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
              LatestRestorableTime: {
                type: "string",
              },
              MultiAZ: {
                type: "boolean",
              },
              EngineVersion: {
                type: "string",
              },
              AutoMinorVersionUpgrade: {
                type: "boolean",
              },
              ReadReplicaSourceDBInstanceIdentifier: {
                type: "string",
              },
              ReadReplicaDBInstanceIdentifiers: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              ReadReplicaDBClusterIdentifiers: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              ReplicaMode: {
                type: "string",
                enum: ["open-read-only", "mounted"],
              },
              LicenseModel: {
                type: "string",
              },
              Iops: {
                type: "number",
              },
              StorageThroughput: {
                type: "number",
              },
              OptionGroupMemberships: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    OptionGroupName: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              CharacterSetName: {
                type: "string",
              },
              NcharCharacterSetName: {
                type: "string",
              },
              SecondaryAvailabilityZone: {
                type: "string",
              },
              PubliclyAccessible: {
                type: "boolean",
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
              StorageType: {
                type: "string",
              },
              StorageEncryptionType: {
                type: "string",
                enum: ["none", "sse-kms", "sse-rds"],
              },
              TdeCredentialArn: {
                type: "string",
              },
              DbInstancePort: {
                type: "number",
              },
              DBClusterIdentifier: {
                type: "string",
              },
              StorageEncrypted: {
                type: "boolean",
              },
              KmsKeyId: {
                type: "string",
              },
              DbiResourceId: {
                type: "string",
              },
              CACertificateIdentifier: {
                type: "string",
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
                        type: "string",
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              CopyTagsToSnapshot: {
                type: "boolean",
              },
              MonitoringInterval: {
                type: "number",
              },
              EnhancedMonitoringResourceArn: {
                type: "string",
              },
              MonitoringRoleArn: {
                type: "string",
              },
              PromotionTier: {
                type: "number",
              },
              DBInstanceArn: {
                type: "string",
              },
              Timezone: {
                type: "string",
              },
              IAMDatabaseAuthenticationEnabled: {
                type: "boolean",
              },
              DatabaseInsightsMode: {
                type: "string",
                enum: ["standard", "advanced"],
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
              EnabledCloudwatchLogsExports: {
                type: "array",
                items: {
                  type: "string",
                },
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
              DeletionProtection: {
                type: "boolean",
              },
              AssociatedRoles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    RoleArn: {
                      type: "string",
                    },
                    FeatureName: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              ListenerEndpoint: {
                type: "object",
                properties: {
                  Address: {
                    type: "string",
                  },
                  Port: {
                    type: "number",
                  },
                  HostedZoneId: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              MaxAllocatedStorage: {
                type: "number",
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
              AutomationMode: {
                type: "string",
                enum: ["full", "all-paused"],
              },
              ResumeFullAutomationModeTime: {
                type: "string",
              },
              CustomerOwnedIpEnabled: {
                type: "boolean",
              },
              NetworkType: {
                type: "string",
              },
              ActivityStreamStatus: {
                type: "string",
                enum: ["stopped", "starting", "started", "stopping"],
              },
              ActivityStreamKmsKeyId: {
                type: "string",
              },
              ActivityStreamKinesisStreamName: {
                type: "string",
              },
              ActivityStreamMode: {
                type: "string",
                enum: ["sync", "async"],
              },
              ActivityStreamEngineNativeAuditFieldsIncluded: {
                type: "boolean",
              },
              AwsBackupRecoveryPointArn: {
                type: "string",
              },
              DBInstanceAutomatedBackupsReplications: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DBInstanceAutomatedBackupsArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              BackupTarget: {
                type: "string",
              },
              AutomaticRestartTime: {
                type: "string",
              },
              CustomIamInstanceProfile: {
                type: "string",
              },
              ActivityStreamPolicyStatus: {
                type: "string",
                enum: [
                  "locked",
                  "unlocked",
                  "locking-policy",
                  "unlocking-policy",
                ],
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
              ReadReplicaSourceDBClusterIdentifier: {
                type: "string",
              },
              PercentProgress: {
                type: "string",
              },
              MultiTenant: {
                type: "boolean",
              },
              DedicatedLogVolume: {
                type: "boolean",
              },
              IsStorageConfigUpgradeAvailable: {
                type: "boolean",
              },
              EngineLifecycleSupport: {
                type: "string",
              },
              AdditionalStorageVolumes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    VolumeName: {
                      type: "string",
                    },
                    StorageVolumeStatus: {
                      type: "string",
                    },
                    AllocatedStorage: {
                      type: "number",
                    },
                    IOPS: {
                      type: "number",
                    },
                    MaxAllocatedStorage: {
                      type: "number",
                    },
                    StorageThroughput: {
                      type: "number",
                    },
                    StorageType: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              StorageVolumeStatus: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Contains the details of an Amazon RDS DB instance.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default promoteReadReplica;

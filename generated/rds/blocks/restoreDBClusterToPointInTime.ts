import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  RestoreDBClusterToPointInTimeCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const restoreDBClusterToPointInTime: AppBlock = {
  name: "Restore DB Cluster To Point In Time",
  description: `Restores a DB cluster to an arbitrary point in time.`,
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
          description: "The name of the new DB cluster to be created.",
          type: "string",
          required: true,
        },
        RestoreType: {
          name: "Restore Type",
          description: "The type of restore to be performed.",
          type: "string",
          required: false,
        },
        SourceDBClusterIdentifier: {
          name: "Source DB Cluster Identifier",
          description:
            "The identifier of the source DB cluster from which to restore.",
          type: "string",
          required: false,
        },
        RestoreToTime: {
          name: "Restore To Time",
          description: "The date and time to restore the DB cluster to.",
          type: "string",
          required: false,
        },
        UseLatestRestorableTime: {
          name: "Use Latest Restorable Time",
          description:
            "Specifies whether to restore the DB cluster to the latest restorable backup time.",
          type: "boolean",
          required: false,
        },
        Port: {
          name: "Port",
          description:
            "The port number on which the new DB cluster accepts connections.",
          type: "number",
          required: false,
        },
        DBSubnetGroupName: {
          name: "DB Subnet Group Name",
          description:
            "The DB subnet group name to use for the new DB cluster.",
          type: "string",
          required: false,
        },
        OptionGroupName: {
          name: "Option Group Name",
          description: "The name of the option group for the new DB cluster.",
          type: "string",
          required: false,
        },
        VpcSecurityGroupIds: {
          name: "Vpc Security Group Ids",
          description:
            "A list of VPC security groups that the new DB cluster belongs to.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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
        KmsKeyId: {
          name: "Kms Key Id",
          description:
            "The Amazon Web Services KMS key identifier to use when restoring an encrypted DB cluster from an encrypted DB cluster.",
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
        DBClusterParameterGroupName: {
          name: "DB Cluster Parameter Group Name",
          description:
            "The name of the custom DB cluster parameter group to associate with this DB cluster.",
          type: "string",
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
            "The Active Directory directory ID to restore the DB cluster in.",
          type: "string",
          required: false,
        },
        DomainIAMRoleName: {
          name: "Domain IAM Role Name",
          description:
            "The name of the IAM role to be used when making API calls to the Directory Service.",
          type: "string",
          required: false,
        },
        ScalingConfiguration: {
          name: "Scaling Configuration",
          description:
            "For DB clusters in serverless DB engine mode, the scaling properties of the DB cluster.",
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
        EngineMode: {
          name: "Engine Mode",
          description: "The engine mode of the new cluster.",
          type: "string",
          required: false,
        },
        DBClusterInstanceClass: {
          name: "DB Cluster Instance Class",
          description:
            "The compute and memory capacity of the each DB instance in the Multi-AZ DB cluster, for example db.",
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
        PubliclyAccessible: {
          name: "Publicly Accessible",
          description:
            "Specifies whether the DB cluster is publicly accessible.",
          type: "boolean",
          required: false,
        },
        Iops: {
          name: "Iops",
          description:
            "The amount of Provisioned IOPS (input/output operations per second) to be initially allocated for each DB instance in the Multi-AZ DB cluster.",
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
        SourceDbClusterResourceId: {
          name: "Source Db Cluster Resource Id",
          description:
            "The resource ID of the source DB cluster from which to restore.",
          type: "string",
          required: false,
        },
        RdsCustomClusterConfiguration: {
          name: "Rds Custom Cluster Configuration",
          description: "Reserved for future use.",
          type: {
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

        const command = new RestoreDBClusterToPointInTimeCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Restore DB Cluster To Point In Time Result",
      description: "Result from RestoreDBClusterToPointInTime operation",
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

export default restoreDBClusterToPointInTime;

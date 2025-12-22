import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  PromoteReadReplicaDBClusterCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const promoteReadReplicaDBCluster: AppBlock = {
  name: "Promote Read Replica DB Cluster",
  description: `Promotes a read replica DB cluster to a standalone DB cluster.`,
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
            "The identifier of the DB cluster read replica to promote.",
          type: "string",
          required: true,
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

        const command = new PromoteReadReplicaDBClusterCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Promote Read Replica DB Cluster Result",
      description: "Result from PromoteReadReplicaDBCluster operation",
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

export default promoteReadReplicaDBCluster;

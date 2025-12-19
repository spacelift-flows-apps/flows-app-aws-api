import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, DescribeDBClustersCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDBClusters: AppBlock = {
  name: "Describe DB Clusters",
  description: `Describes existing Amazon Aurora DB clusters and Multi-AZ DB clusters.`,
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
            "The user-supplied DB cluster identifier or the Amazon Resource Name (ARN) of the DB cluster.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description:
            "A filter that specifies one or more DB clusters to describe.",
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
            "An optional pagination token provided by a previous DescribeDBClusters request.",
          type: "string",
          required: false,
        },
        IncludeShared: {
          name: "Include Shared",
          description:
            "Specifies whether the output includes information about clusters shared from other Amazon Web Services accounts.",
          type: "boolean",
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

        const command = new DescribeDBClustersCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe DB Clusters Result",
      description: "Result from DescribeDBClusters operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "A pagination token that can be used in a later DescribeDBClusters request.",
          },
          DBClusters: {
            type: "array",
            items: {
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
                        type: "object",
                        additionalProperties: true,
                      },
                      Status: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      Normal: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Status: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Message: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      IsClusterWriter: {
                        type: "object",
                        additionalProperties: true,
                      },
                      DBClusterParameterGroupStatus: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PromotionTier: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      Status: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      Status: {
                        type: "object",
                        additionalProperties: true,
                      },
                      FeatureName: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      Status: {
                        type: "object",
                        additionalProperties: true,
                      },
                      FQDN: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IAMRoleName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      OU: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AuthSecretArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      DnsIps: {
                        type: "object",
                        additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        LogTypesToDisable: {
                          type: "object",
                          additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        TransitGatewayMulticastDomainId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ReplicaMode: {
                          type: "object",
                          additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        ValidTill: {
                          type: "object",
                          additionalProperties: true,
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
            },
            description: "Contains a list of DB clusters for the user.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDBClusters;

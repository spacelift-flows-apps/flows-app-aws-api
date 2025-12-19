import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDBInstances: AppBlock = {
  name: "Describe DB Instances",
  description: `Describes provisioned RDS instances.`,
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
            "The user-supplied instance identifier or the Amazon Resource Name (ARN) of the DB instance.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description:
            "A filter that specifies one or more DB instances to describe.",
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
            "An optional pagination token provided by a previous DescribeDBInstances request.",
          type: "string",
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

        const command = new DescribeDBInstancesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe DB Instances Result",
      description: "Result from DescribeDBInstances operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous request.",
          },
          DBInstances: {
            type: "array",
            items: {
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
                AutomaticRestartTime: {
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
                DBParameterGroups: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      DBParameterGroupName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ParameterApplyStatus: {
                        type: "object",
                        additionalProperties: true,
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
                        additionalProperties: true,
                      },
                    },
                    DBSubnetGroupArn: {
                      type: "string",
                    },
                    SupportedNetworkTypes: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                PreferredMaintenanceWindow: {
                  type: "string",
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
                    ProcessorFeatures: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    IAMDatabaseAuthenticationEnabled: {
                      type: "boolean",
                    },
                    AutomationMode: {
                      type: "string",
                    },
                    ResumeFullAutomationModeTime: {
                      type: "string",
                    },
                    StorageThroughput: {
                      type: "number",
                    },
                    Engine: {
                      type: "string",
                    },
                    DedicatedLogVolume: {
                      type: "boolean",
                    },
                    MultiTenant: {
                      type: "boolean",
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
                },
                LicenseModel: {
                  type: "string",
                },
                Iops: {
                  type: "number",
                },
                OptionGroupMemberships: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      OptionGroupName: {
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
                StorageType: {
                  type: "string",
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
                DeletionProtection: {
                  type: "boolean",
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
                      FeatureName: {
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
                DBInstanceAutomatedBackupsReplications: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      DBInstanceAutomatedBackupsArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                CustomerOwnedIpEnabled: {
                  type: "boolean",
                },
                AwsBackupRecoveryPointArn: {
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
                ActivityStreamMode: {
                  type: "string",
                },
                ActivityStreamEngineNativeAuditFieldsIncluded: {
                  type: "boolean",
                },
                AutomationMode: {
                  type: "string",
                },
                ResumeFullAutomationModeTime: {
                  type: "string",
                },
                CustomIamInstanceProfile: {
                  type: "string",
                },
                BackupTarget: {
                  type: "string",
                },
                NetworkType: {
                  type: "string",
                },
                ActivityStreamPolicyStatus: {
                  type: "string",
                },
                StorageThroughput: {
                  type: "number",
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
                ReadReplicaSourceDBClusterIdentifier: {
                  type: "string",
                },
                PercentProgress: {
                  type: "string",
                },
                DedicatedLogVolume: {
                  type: "boolean",
                },
                IsStorageConfigUpgradeAvailable: {
                  type: "boolean",
                },
                MultiTenant: {
                  type: "boolean",
                },
                EngineLifecycleSupport: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of DBInstance instances.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDBInstances;

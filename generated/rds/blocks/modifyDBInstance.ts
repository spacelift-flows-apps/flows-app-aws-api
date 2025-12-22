import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, ModifyDBInstanceCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyDBInstance: AppBlock = {
  name: "Modify DB Instance",
  description: `Modifies settings for a DB instance.`,
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
          description: "The identifier of DB instance to modify.",
          type: "string",
          required: true,
        },
        AllocatedStorage: {
          name: "Allocated Storage",
          description:
            "The new amount of storage in gibibytes (GiB) to allocate for the DB instance.",
          type: "number",
          required: false,
        },
        DBInstanceClass: {
          name: "DB Instance Class",
          description:
            "The new compute and memory capacity of the DB instance, for example db.",
          type: "string",
          required: false,
        },
        DBSubnetGroupName: {
          name: "DB Subnet Group Name",
          description: "The new DB subnet group for the DB instance.",
          type: "string",
          required: false,
        },
        DBSecurityGroups: {
          name: "DB Security Groups",
          description:
            "A list of DB security groups to authorize on this DB instance.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        VpcSecurityGroupIds: {
          name: "Vpc Security Group Ids",
          description:
            "A list of Amazon EC2 VPC security groups to associate with this DB instance.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ApplyImmediately: {
          name: "Apply Immediately",
          description:
            "Specifies whether the modifications in this request and any pending modifications are asynchronously applied as soon as possible, regardless of the PreferredMaintenanceWindow setting for the DB instance.",
          type: "boolean",
          required: false,
        },
        MasterUserPassword: {
          name: "Master User Password",
          description: "The new password for the master user.",
          type: "string",
          required: false,
        },
        DBParameterGroupName: {
          name: "DB Parameter Group Name",
          description:
            "The name of the DB parameter group to apply to the DB instance.",
          type: "string",
          required: false,
        },
        BackupRetentionPeriod: {
          name: "Backup Retention Period",
          description: "The number of days to retain automated backups.",
          type: "number",
          required: false,
        },
        PreferredBackupWindow: {
          name: "Preferred Backup Window",
          description:
            "The daily time range during which automated backups are created if automated backups are enabled, as determined by the BackupRetentionPeriod parameter.",
          type: "string",
          required: false,
        },
        PreferredMaintenanceWindow: {
          name: "Preferred Maintenance Window",
          description:
            "The weekly time range during which system maintenance can occur, which might result in an outage.",
          type: "string",
          required: false,
        },
        MultiAZ: {
          name: "Multi AZ",
          description:
            "Specifies whether the DB instance is a Multi-AZ deployment.",
          type: "boolean",
          required: false,
        },
        EngineVersion: {
          name: "Engine Version",
          description:
            "The version number of the database engine to upgrade to.",
          type: "string",
          required: false,
        },
        AllowMajorVersionUpgrade: {
          name: "Allow Major Version Upgrade",
          description: "Specifies whether major version upgrades are allowed.",
          type: "boolean",
          required: false,
        },
        AutoMinorVersionUpgrade: {
          name: "Auto Minor Version Upgrade",
          description:
            "Specifies whether minor version upgrades are applied automatically to the DB instance during the maintenance window.",
          type: "boolean",
          required: false,
        },
        LicenseModel: {
          name: "License Model",
          description: "The license model for the DB instance.",
          type: "string",
          required: false,
        },
        Iops: {
          name: "Iops",
          description:
            "The new Provisioned IOPS (I/O operations per second) value for the RDS instance.",
          type: "number",
          required: false,
        },
        OptionGroupName: {
          name: "Option Group Name",
          description: "The option group to associate the DB instance with.",
          type: "string",
          required: false,
        },
        NewDBInstanceIdentifier: {
          name: "New DB Instance Identifier",
          description:
            "The new identifier for the DB instance when renaming a DB instance.",
          type: "string",
          required: false,
        },
        StorageType: {
          name: "Storage Type",
          description: "The storage type to associate with the DB instance.",
          type: "string",
          required: false,
        },
        TdeCredentialArn: {
          name: "Tde Credential Arn",
          description:
            "The ARN from the key store with which to associate the instance for TDE encryption.",
          type: "string",
          required: false,
        },
        TdeCredentialPassword: {
          name: "Tde Credential Password",
          description:
            "The password for the given ARN from the key store in order to access the device.",
          type: "string",
          required: false,
        },
        CACertificateIdentifier: {
          name: "CA Certificate Identifier",
          description:
            "The CA certificate identifier to use for the DB instance's server certificate.",
          type: "string",
          required: false,
        },
        Domain: {
          name: "Domain",
          description:
            "The Active Directory directory ID to move the DB instance to.",
          type: "string",
          required: false,
        },
        DomainFqdn: {
          name: "Domain Fqdn",
          description:
            "The fully qualified domain name (FQDN) of an Active Directory domain.",
          type: "string",
          required: false,
        },
        DomainOu: {
          name: "Domain Ou",
          description:
            "The Active Directory organizational unit for your DB instance to join.",
          type: "string",
          required: false,
        },
        DomainAuthSecretArn: {
          name: "Domain Auth Secret Arn",
          description:
            "The ARN for the Secrets Manager secret with the credentials for the user joining the domain.",
          type: "string",
          required: false,
        },
        DomainDnsIps: {
          name: "Domain Dns Ips",
          description:
            "The IPv4 DNS IP addresses of your primary and secondary Active Directory domain controllers.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        CopyTagsToSnapshot: {
          name: "Copy Tags To Snapshot",
          description:
            "Specifies whether to copy all tags from the DB instance to snapshots of the DB instance.",
          type: "boolean",
          required: false,
        },
        MonitoringInterval: {
          name: "Monitoring Interval",
          description:
            "The interval, in seconds, between points when Enhanced Monitoring metrics are collected for the DB instance.",
          type: "number",
          required: false,
        },
        DBPortNumber: {
          name: "DB Port Number",
          description:
            "The port number on which the database accepts connections.",
          type: "number",
          required: false,
        },
        PubliclyAccessible: {
          name: "Publicly Accessible",
          description:
            "Specifies whether the DB instance is publicly accessible.",
          type: "boolean",
          required: false,
        },
        MonitoringRoleArn: {
          name: "Monitoring Role Arn",
          description:
            "The ARN for the IAM role that permits RDS to send enhanced monitoring metrics to Amazon CloudWatch Logs.",
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
        DisableDomain: {
          name: "Disable Domain",
          description:
            "Specifies whether to remove the DB instance from the Active Directory domain.",
          type: "boolean",
          required: false,
        },
        PromotionTier: {
          name: "Promotion Tier",
          description:
            "The order of priority in which an Aurora Replica is promoted to the primary instance after a failure of the existing primary instance.",
          type: "number",
          required: false,
        },
        EnableIAMDatabaseAuthentication: {
          name: "Enable IAM Database Authentication",
          description:
            "Specifies whether to enable mapping of Amazon Web Services Identity and Access Management (IAM) accounts to database accounts.",
          type: "boolean",
          required: false,
        },
        DatabaseInsightsMode: {
          name: "Database Insights Mode",
          description:
            "Specifies the mode of Database Insights to enable for the DB instance.",
          type: "string",
          required: false,
        },
        EnablePerformanceInsights: {
          name: "Enable Performance Insights",
          description:
            "Specifies whether to enable Performance Insights for the DB instance.",
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
        CloudwatchLogsExportConfiguration: {
          name: "Cloudwatch Logs Export Configuration",
          description:
            "The log types to be enabled for export to CloudWatch Logs for a specific DB instance.",
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
        ProcessorFeatures: {
          name: "Processor Features",
          description:
            "The number of CPU cores and the number of threads per core for the DB instance class of the DB instance.",
          type: {
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
          required: false,
        },
        UseDefaultProcessorFeatures: {
          name: "Use Default Processor Features",
          description:
            "Specifies whether the DB instance class of the DB instance uses its default processor features.",
          type: "boolean",
          required: false,
        },
        DeletionProtection: {
          name: "Deletion Protection",
          description:
            "Specifies whether the DB instance has deletion protection enabled.",
          type: "boolean",
          required: false,
        },
        MaxAllocatedStorage: {
          name: "Max Allocated Storage",
          description:
            "The upper limit in gibibytes (GiB) to which Amazon RDS can automatically scale the storage of the DB instance.",
          type: "number",
          required: false,
        },
        CertificateRotationRestart: {
          name: "Certificate Rotation Restart",
          description:
            "Specifies whether the DB instance is restarted when you rotate your SSL/TLS certificate.",
          type: "boolean",
          required: false,
        },
        ReplicaMode: {
          name: "Replica Mode",
          description: "The open mode of a replica database.",
          type: "string",
          required: false,
        },
        EnableCustomerOwnedIp: {
          name: "Enable Customer Owned Ip",
          description:
            "Specifies whether to enable a customer-owned IP address (CoIP) for an RDS on Outposts DB instance.",
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
        AutomationMode: {
          name: "Automation Mode",
          description: "The automation mode of the RDS Custom DB instance.",
          type: "string",
          required: false,
        },
        ResumeFullAutomationModeMinutes: {
          name: "Resume Full Automation Mode Minutes",
          description: "The number of minutes to pause the automation.",
          type: "number",
          required: false,
        },
        NetworkType: {
          name: "Network Type",
          description: "The network type of the DB instance.",
          type: "string",
          required: false,
        },
        StorageThroughput: {
          name: "Storage Throughput",
          description: "The storage throughput value for the DB instance.",
          type: "number",
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
        Engine: {
          name: "Engine",
          description:
            "The target Oracle DB engine when you convert a non-CDB to a CDB.",
          type: "string",
          required: false,
        },
        DedicatedLogVolume: {
          name: "Dedicated Log Volume",
          description:
            "Indicates whether the DB instance has a dedicated log volume (DLV) enabled.",
          type: "boolean",
          required: false,
        },
        MultiTenant: {
          name: "Multi Tenant",
          description:
            "Specifies whether the to convert your DB instance from the single-tenant conﬁguration to the multi-tenant conﬁguration.",
          type: "boolean",
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

        const command = new ModifyDBInstanceCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify DB Instance Result",
      description: "Result from ModifyDBInstance operation",
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
                          type: "object",
                          additionalProperties: true,
                        },
                        SubnetAvailabilityZone: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SubnetOutpost: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SubnetStatus: {
                          type: "object",
                          additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
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
            description: "Contains the details of an Amazon RDS DB instance.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyDBInstance;

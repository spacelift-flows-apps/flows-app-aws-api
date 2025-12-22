import { AppBlock, events } from "@slflows/sdk/v1";
import { RedshiftClient, CreateClusterCommand } from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createCluster: AppBlock = {
  name: "Create Cluster",
  description: `Creates a new cluster with the specified parameters.`,
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
        DBName: {
          name: "DB Name",
          description:
            "The name of the first database to be created when the cluster is created.",
          type: "string",
          required: false,
        },
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description: "A unique identifier for the cluster.",
          type: "string",
          required: true,
        },
        ClusterType: {
          name: "Cluster Type",
          description: "The type of the cluster.",
          type: "string",
          required: false,
        },
        NodeType: {
          name: "Node Type",
          description: "The node type to be provisioned for the cluster.",
          type: "string",
          required: true,
        },
        MasterUsername: {
          name: "Master Username",
          description:
            "The user name associated with the admin user account for the cluster that is being created.",
          type: "string",
          required: true,
        },
        MasterUserPassword: {
          name: "Master User Password",
          description:
            "The password associated with the admin user account for the cluster that is being created.",
          type: "string",
          required: false,
        },
        ClusterSecurityGroups: {
          name: "Cluster Security Groups",
          description:
            "A list of security groups to be associated with this cluster.",
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
            "A list of Virtual Private Cloud (VPC) security groups to be associated with the cluster.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ClusterSubnetGroupName: {
          name: "Cluster Subnet Group Name",
          description:
            "The name of a cluster subnet group to be associated with this cluster.",
          type: "string",
          required: false,
        },
        AvailabilityZone: {
          name: "Availability Zone",
          description:
            "The EC2 Availability Zone (AZ) in which you want Amazon Redshift to provision the cluster.",
          type: "string",
          required: false,
        },
        PreferredMaintenanceWindow: {
          name: "Preferred Maintenance Window",
          description:
            "The weekly time range (in UTC) during which automated cluster maintenance can occur.",
          type: "string",
          required: false,
        },
        ClusterParameterGroupName: {
          name: "Cluster Parameter Group Name",
          description:
            "The name of the parameter group to be associated with this cluster.",
          type: "string",
          required: false,
        },
        AutomatedSnapshotRetentionPeriod: {
          name: "Automated Snapshot Retention Period",
          description:
            "The number of days that automated snapshots are retained.",
          type: "number",
          required: false,
        },
        ManualSnapshotRetentionPeriod: {
          name: "Manual Snapshot Retention Period",
          description:
            "The default number of days to retain a manual snapshot.",
          type: "number",
          required: false,
        },
        Port: {
          name: "Port",
          description:
            "The port number on which the cluster accepts incoming connections.",
          type: "number",
          required: false,
        },
        ClusterVersion: {
          name: "Cluster Version",
          description:
            "The version of the Amazon Redshift engine software that you want to deploy on the cluster.",
          type: "string",
          required: false,
        },
        AllowVersionUpgrade: {
          name: "Allow Version Upgrade",
          description:
            "If true, major version upgrades can be applied during the maintenance window to the Amazon Redshift engine that is running on the cluster.",
          type: "boolean",
          required: false,
        },
        NumberOfNodes: {
          name: "Number Of Nodes",
          description: "The number of compute nodes in the cluster.",
          type: "number",
          required: false,
        },
        PubliclyAccessible: {
          name: "Publicly Accessible",
          description:
            "If true, the cluster can be accessed from a public network.",
          type: "boolean",
          required: false,
        },
        Encrypted: {
          name: "Encrypted",
          description: "If true, the data in the cluster is encrypted at rest.",
          type: "boolean",
          required: false,
        },
        HsmClientCertificateIdentifier: {
          name: "Hsm Client Certificate Identifier",
          description:
            "Specifies the name of the HSM client certificate the Amazon Redshift cluster uses to retrieve the data encryption keys stored in an HSM.",
          type: "string",
          required: false,
        },
        HsmConfigurationIdentifier: {
          name: "Hsm Configuration Identifier",
          description:
            "Specifies the name of the HSM configuration that contains the information the Amazon Redshift cluster can use to retrieve and store keys in an HSM.",
          type: "string",
          required: false,
        },
        ElasticIp: {
          name: "Elastic Ip",
          description: "The Elastic IP (EIP) address for the cluster.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "A list of tag instances.",
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
            "The Key Management Service (KMS) key ID of the encryption key that you want to use to encrypt data in the cluster.",
          type: "string",
          required: false,
        },
        EnhancedVpcRouting: {
          name: "Enhanced Vpc Routing",
          description:
            "An option that specifies whether to create the cluster with enhanced VPC routing enabled.",
          type: "boolean",
          required: false,
        },
        AdditionalInfo: {
          name: "Additional Info",
          description: "Reserved.",
          type: "string",
          required: false,
        },
        IamRoles: {
          name: "Iam Roles",
          description:
            "A list of Identity and Access Management (IAM) roles that can be used by the cluster to access other Amazon Web Services services.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        MaintenanceTrackName: {
          name: "Maintenance Track Name",
          description:
            "An optional parameter for the name of the maintenance track for the cluster.",
          type: "string",
          required: false,
        },
        SnapshotScheduleIdentifier: {
          name: "Snapshot Schedule Identifier",
          description: "A unique identifier for the snapshot schedule.",
          type: "string",
          required: false,
        },
        AvailabilityZoneRelocation: {
          name: "Availability Zone Relocation",
          description:
            "The option to enable relocation for an Amazon Redshift cluster between Availability Zones after the cluster is created.",
          type: "boolean",
          required: false,
        },
        AquaConfigurationStatus: {
          name: "Aqua Configuration Status",
          description: "This parameter is retired.",
          type: "string",
          required: false,
        },
        DefaultIamRoleArn: {
          name: "Default Iam Role Arn",
          description:
            "The Amazon Resource Name (ARN) for the IAM role that was set as default for the cluster when the cluster was created.",
          type: "string",
          required: false,
        },
        LoadSampleData: {
          name: "Load Sample Data",
          description:
            "A flag that specifies whether to load sample data once the cluster is created.",
          type: "string",
          required: false,
        },
        ManageMasterPassword: {
          name: "Manage Master Password",
          description:
            "If true, Amazon Redshift uses Secrets Manager to manage this cluster's admin credentials.",
          type: "boolean",
          required: false,
        },
        MasterPasswordSecretKmsKeyId: {
          name: "Master Password Secret Kms Key Id",
          description:
            "The ID of the Key Management Service (KMS) key used to encrypt and store the cluster's admin credentials secret.",
          type: "string",
          required: false,
        },
        IpAddressType: {
          name: "Ip Address Type",
          description: "The IP address types that the cluster supports.",
          type: "string",
          required: false,
        },
        MultiAZ: {
          name: "Multi AZ",
          description:
            "If true, Amazon Redshift will deploy the cluster in two Availability Zones (AZ).",
          type: "boolean",
          required: false,
        },
        RedshiftIdcApplicationArn: {
          name: "Redshift Idc Application Arn",
          description:
            "The Amazon resource name (ARN) of the Amazon Redshift IAM Identity Center application.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateClusterCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Cluster Result",
      description: "Result from CreateCluster operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Cluster: {
            type: "object",
            properties: {
              ClusterIdentifier: {
                type: "string",
              },
              NodeType: {
                type: "string",
              },
              ClusterStatus: {
                type: "string",
              },
              ClusterAvailabilityStatus: {
                type: "string",
              },
              ModifyStatus: {
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
                  VpcEndpoints: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        VpcEndpointId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        VpcId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        NetworkInterfaces: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
              ClusterCreateTime: {
                type: "string",
              },
              AutomatedSnapshotRetentionPeriod: {
                type: "number",
              },
              ManualSnapshotRetentionPeriod: {
                type: "number",
              },
              ClusterSecurityGroups: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ClusterSecurityGroupName: {
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
              ClusterParameterGroups: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ParameterGroupName: {
                      type: "string",
                    },
                    ParameterApplyStatus: {
                      type: "string",
                    },
                    ClusterParameterStatusList: {
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
              ClusterSubnetGroupName: {
                type: "string",
              },
              VpcId: {
                type: "string",
              },
              AvailabilityZone: {
                type: "string",
              },
              PreferredMaintenanceWindow: {
                type: "string",
              },
              PendingModifiedValues: {
                type: "object",
                properties: {
                  MasterUserPassword: {
                    type: "string",
                  },
                  NodeType: {
                    type: "string",
                  },
                  NumberOfNodes: {
                    type: "number",
                  },
                  ClusterType: {
                    type: "string",
                  },
                  ClusterVersion: {
                    type: "string",
                  },
                  AutomatedSnapshotRetentionPeriod: {
                    type: "number",
                  },
                  ClusterIdentifier: {
                    type: "string",
                  },
                  PubliclyAccessible: {
                    type: "boolean",
                  },
                  EnhancedVpcRouting: {
                    type: "boolean",
                  },
                  MaintenanceTrackName: {
                    type: "string",
                  },
                  EncryptionType: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              ClusterVersion: {
                type: "string",
              },
              AllowVersionUpgrade: {
                type: "boolean",
              },
              NumberOfNodes: {
                type: "number",
              },
              PubliclyAccessible: {
                type: "boolean",
              },
              Encrypted: {
                type: "boolean",
              },
              RestoreStatus: {
                type: "object",
                properties: {
                  Status: {
                    type: "string",
                  },
                  CurrentRestoreRateInMegaBytesPerSecond: {
                    type: "number",
                  },
                  SnapshotSizeInMegaBytes: {
                    type: "number",
                  },
                  ProgressInMegaBytes: {
                    type: "number",
                  },
                  ElapsedTimeInSeconds: {
                    type: "number",
                  },
                  EstimatedTimeToCompletionInSeconds: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              DataTransferProgress: {
                type: "object",
                properties: {
                  Status: {
                    type: "string",
                  },
                  CurrentRateInMegaBytesPerSecond: {
                    type: "number",
                  },
                  TotalDataInMegaBytes: {
                    type: "number",
                  },
                  DataTransferredInMegaBytes: {
                    type: "number",
                  },
                  EstimatedTimeToCompletionInSeconds: {
                    type: "number",
                  },
                  ElapsedTimeInSeconds: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              HsmStatus: {
                type: "object",
                properties: {
                  HsmClientCertificateIdentifier: {
                    type: "string",
                  },
                  HsmConfigurationIdentifier: {
                    type: "string",
                  },
                  Status: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              ClusterSnapshotCopyStatus: {
                type: "object",
                properties: {
                  DestinationRegion: {
                    type: "string",
                  },
                  RetentionPeriod: {
                    type: "number",
                  },
                  ManualSnapshotRetentionPeriod: {
                    type: "number",
                  },
                  SnapshotCopyGrantName: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              ClusterPublicKey: {
                type: "string",
              },
              ClusterNodes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    NodeRole: {
                      type: "string",
                    },
                    PrivateIPAddress: {
                      type: "string",
                    },
                    PublicIPAddress: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              ElasticIpStatus: {
                type: "object",
                properties: {
                  ElasticIp: {
                    type: "string",
                  },
                  Status: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              ClusterRevisionNumber: {
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
              KmsKeyId: {
                type: "string",
              },
              EnhancedVpcRouting: {
                type: "boolean",
              },
              IamRoles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    IamRoleArn: {
                      type: "string",
                    },
                    ApplyStatus: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              PendingActions: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              MaintenanceTrackName: {
                type: "string",
              },
              ElasticResizeNumberOfNodeOptions: {
                type: "string",
              },
              DeferredMaintenanceWindows: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DeferMaintenanceIdentifier: {
                      type: "string",
                    },
                    DeferMaintenanceStartTime: {
                      type: "string",
                    },
                    DeferMaintenanceEndTime: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              SnapshotScheduleIdentifier: {
                type: "string",
              },
              SnapshotScheduleState: {
                type: "string",
              },
              ExpectedNextSnapshotScheduleTime: {
                type: "string",
              },
              ExpectedNextSnapshotScheduleTimeStatus: {
                type: "string",
              },
              NextMaintenanceWindowStartTime: {
                type: "string",
              },
              ResizeInfo: {
                type: "object",
                properties: {
                  ResizeType: {
                    type: "string",
                  },
                  AllowCancelResize: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              AvailabilityZoneRelocationStatus: {
                type: "string",
              },
              ClusterNamespaceArn: {
                type: "string",
              },
              TotalStorageCapacityInMegaBytes: {
                type: "number",
              },
              AquaConfiguration: {
                type: "object",
                properties: {
                  AquaStatus: {
                    type: "string",
                  },
                  AquaConfigurationStatus: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              DefaultIamRoleArn: {
                type: "string",
              },
              ReservedNodeExchangeStatus: {
                type: "object",
                properties: {
                  ReservedNodeExchangeRequestId: {
                    type: "string",
                  },
                  Status: {
                    type: "string",
                  },
                  RequestTime: {
                    type: "string",
                  },
                  SourceReservedNodeId: {
                    type: "string",
                  },
                  SourceReservedNodeType: {
                    type: "string",
                  },
                  SourceReservedNodeCount: {
                    type: "number",
                  },
                  TargetReservedNodeOfferingId: {
                    type: "string",
                  },
                  TargetReservedNodeType: {
                    type: "string",
                  },
                  TargetReservedNodeCount: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              CustomDomainName: {
                type: "string",
              },
              CustomDomainCertificateArn: {
                type: "string",
              },
              CustomDomainCertificateExpiryDate: {
                type: "string",
              },
              MasterPasswordSecretArn: {
                type: "string",
              },
              MasterPasswordSecretKmsKeyId: {
                type: "string",
              },
              IpAddressType: {
                type: "string",
              },
              MultiAZ: {
                type: "string",
              },
              MultiAZSecondary: {
                type: "object",
                properties: {
                  AvailabilityZone: {
                    type: "string",
                  },
                  ClusterNodes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        NodeRole: {
                          type: "object",
                          additionalProperties: true,
                        },
                        PrivateIPAddress: {
                          type: "object",
                          additionalProperties: true,
                        },
                        PublicIPAddress: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "Describes a cluster.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createCluster;

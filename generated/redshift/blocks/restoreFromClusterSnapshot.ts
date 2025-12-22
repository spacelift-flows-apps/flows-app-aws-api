import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  RestoreFromClusterSnapshotCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const restoreFromClusterSnapshot: AppBlock = {
  name: "Restore From Cluster Snapshot",
  description: `Creates a new cluster from a snapshot.`,
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
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description:
            "The identifier of the cluster that will be created from restoring the snapshot.",
          type: "string",
          required: true,
        },
        SnapshotIdentifier: {
          name: "Snapshot Identifier",
          description:
            "The name of the snapshot from which to create the new cluster.",
          type: "string",
          required: false,
        },
        SnapshotArn: {
          name: "Snapshot Arn",
          description:
            "The Amazon Resource Name (ARN) of the snapshot associated with the message to restore from a cluster.",
          type: "string",
          required: false,
        },
        SnapshotClusterIdentifier: {
          name: "Snapshot Cluster Identifier",
          description:
            "The name of the cluster the source snapshot was created from.",
          type: "string",
          required: false,
        },
        Port: {
          name: "Port",
          description:
            "The port number on which the cluster accepts connections.",
          type: "number",
          required: false,
        },
        AvailabilityZone: {
          name: "Availability Zone",
          description:
            "The Amazon EC2 Availability Zone in which to restore the cluster.",
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
        ClusterSubnetGroupName: {
          name: "Cluster Subnet Group Name",
          description:
            "The name of the subnet group where you want to cluster restored.",
          type: "string",
          required: false,
        },
        PubliclyAccessible: {
          name: "Publicly Accessible",
          description:
            "If true, the cluster can be accessed from a public network.",
          type: "boolean",
          required: false,
        },
        OwnerAccount: {
          name: "Owner Account",
          description:
            "The Amazon Web Services account used to create or copy the snapshot.",
          type: "string",
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
        ClusterParameterGroupName: {
          name: "Cluster Parameter Group Name",
          description:
            "The name of the parameter group to be associated with this cluster.",
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
        PreferredMaintenanceWindow: {
          name: "Preferred Maintenance Window",
          description:
            "The weekly time range (in UTC) during which automated cluster maintenance can occur.",
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
        KmsKeyId: {
          name: "Kms Key Id",
          description:
            "The Key Management Service (KMS) key ID of the encryption key that encrypts data in the cluster restored from a shared snapshot.",
          type: "string",
          required: false,
        },
        NodeType: {
          name: "Node Type",
          description:
            "The node type that the restored cluster will be provisioned with.",
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
            "The name of the maintenance track for the restored cluster.",
          type: "string",
          required: false,
        },
        SnapshotScheduleIdentifier: {
          name: "Snapshot Schedule Identifier",
          description: "A unique identifier for the snapshot schedule.",
          type: "string",
          required: false,
        },
        NumberOfNodes: {
          name: "Number Of Nodes",
          description:
            "The number of nodes specified when provisioning the restored cluster.",
          type: "number",
          required: false,
        },
        AvailabilityZoneRelocation: {
          name: "Availability Zone Relocation",
          description:
            "The option to enable relocation for an Amazon Redshift cluster between Availability Zones after the cluster is restored.",
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
            "The Amazon Resource Name (ARN) for the IAM role that was set as default for the cluster when the cluster was last modified while it was restored from a snapshot.",
          type: "string",
          required: false,
        },
        ReservedNodeId: {
          name: "Reserved Node Id",
          description: "The identifier of the target reserved node offering.",
          type: "string",
          required: false,
        },
        TargetReservedNodeOfferingId: {
          name: "Target Reserved Node Offering Id",
          description: "The identifier of the target reserved node offering.",
          type: "string",
          required: false,
        },
        Encrypted: {
          name: "Encrypted",
          description:
            "Enables support for restoring an unencrypted snapshot to a cluster encrypted with Key Management Service (KMS) and a customer managed key.",
          type: "boolean",
          required: false,
        },
        ManageMasterPassword: {
          name: "Manage Master Password",
          description:
            "If true, Amazon Redshift uses Secrets Manager to manage the restored cluster's admin credentials.",
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
          description: "The IP address type for the cluster.",
          type: "string",
          required: false,
        },
        MultiAZ: {
          name: "Multi AZ",
          description:
            "If true, the snapshot will be restored to a cluster deployed in two Availability Zones.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new RestoreFromClusterSnapshotCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Restore From Cluster Snapshot Result",
      description: "Result from RestoreFromClusterSnapshot operation",
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

export default restoreFromClusterSnapshot;

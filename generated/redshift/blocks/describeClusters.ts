import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeClustersCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeClusters: AppBlock = {
  name: "Describe Clusters",
  description: `Returns properties of provisioned clusters including general cluster properties, cluster database properties, maintenance and backup properties, and security and access properties.`,
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
            "The unique identifier of a cluster whose properties you are requesting.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of response records to return in each call.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional parameter that specifies the starting point to return a set of response records.",
          type: "string",
          required: false,
        },
        TagKeys: {
          name: "Tag Keys",
          description:
            "A tag key or keys for which you want to return all matching clusters that are associated with the specified key or keys.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        TagValues: {
          name: "Tag Values",
          description:
            "A tag value or values for which you want to return all matching clusters that are associated with the specified tag value or values.",
          type: {
            type: "array",
            items: {
              type: "string",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeClustersCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Clusters Result",
      description: "Result from DescribeClusters operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "A value that indicates the starting point for the next set of response records in a subsequent request.",
          },
          Clusters: {
            type: "array",
            items: {
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
                        additionalProperties: true,
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
                ClusterParameterGroups: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ParameterGroupName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ParameterApplyStatus: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ClusterParameterStatusList: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      ApplyStatus: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      DeferMaintenanceStartTime: {
                        type: "object",
                        additionalProperties: true,
                      },
                      DeferMaintenanceEndTime: {
                        type: "object",
                        additionalProperties: true,
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
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of Cluster objects, where each object describes one cluster.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeClusters;

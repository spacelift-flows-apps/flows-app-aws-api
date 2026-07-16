import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, UpdateNodegroupVersionCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateNodegroupVersion: AppBlock = {
  name: "Update Nodegroup Version",
  description: `Updates the Kubernetes version or AMI version of an Amazon EKS managed node group.`,
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
        clusterName: {
          name: "cluster Name",
          description: "The name of your cluster.",
          type: "string",
          required: true,
        },
        nodegroupName: {
          name: "nodegroup Name",
          description: "The name of the managed node group to update.",
          type: "string",
          required: true,
        },
        version: {
          name: "version",
          description: "The Kubernetes version to update to.",
          type: "string",
          required: false,
        },
        releaseVersion: {
          name: "release Version",
          description:
            "The AMI version of the Amazon EKS optimized AMI to use for the update.",
          type: "string",
          required: false,
        },
        launchTemplate: {
          name: "launch Template",
          description:
            "An object representing a node group's launch template specification.",
          type: {
            type: "object",
            properties: {
              name: {
                type: "string",
              },
              version: {
                type: "string",
              },
              id: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        force: {
          name: "force",
          description:
            "Force the update if any Pod on the existing node group can't be drained due to a Pod disruption budget issue.",
          type: "boolean",
          required: false,
        },
        clientRequestToken: {
          name: "client Request Token",
          description:
            "A unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
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

        const client = new EKSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateNodegroupVersionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Nodegroup Version Result",
      description: "Result from UpdateNodegroupVersion operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          update: {
            type: "object",
            properties: {
              id: {
                type: "string",
              },
              status: {
                type: "string",
                enum: ["InProgress", "Failed", "Cancelled", "Successful"],
              },
              type: {
                type: "string",
                enum: [
                  "VersionUpdate",
                  "EndpointAccessUpdate",
                  "LoggingUpdate",
                  "ConfigUpdate",
                  "AssociateIdentityProviderConfig",
                  "DisassociateIdentityProviderConfig",
                  "AssociateEncryptionConfig",
                  "AddonUpdate",
                  "VpcConfigUpdate",
                  "AccessConfigUpdate",
                  "UpgradePolicyUpdate",
                  "ZonalShiftConfigUpdate",
                  "AutoModeUpdate",
                  "RemoteNetworkConfigUpdate",
                  "DeletionProtectionUpdate",
                  "ControlPlaneScalingConfigUpdate",
                  "VendedLogsUpdate",
                ],
              },
              params: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: [
                        "Version",
                        "PlatformVersion",
                        "EndpointPrivateAccess",
                        "EndpointPublicAccess",
                        "ClusterLogging",
                        "DesiredSize",
                        "LabelsToAdd",
                        "LabelsToRemove",
                        "TaintsToAdd",
                        "TaintsToRemove",
                        "MaxSize",
                        "MinSize",
                        "ReleaseVersion",
                        "PublicAccessCidrs",
                        "LaunchTemplateName",
                        "LaunchTemplateVersion",
                        "IdentityProviderConfig",
                        "EncryptionConfig",
                        "AddonVersion",
                        "ServiceAccountRoleArn",
                        "ResolveConflicts",
                        "MaxUnavailable",
                        "MaxUnavailablePercentage",
                        "NodeRepairEnabled",
                        "UpdateStrategy",
                        "ConfigurationValues",
                        "SecurityGroups",
                        "Subnets",
                        "AuthenticationMode",
                        "PodIdentityAssociations",
                        "UpgradePolicy",
                        "ZonalShiftConfig",
                        "ComputeConfig",
                        "StorageConfig",
                        "KubernetesNetworkConfig",
                        "RemoteNetworkConfig",
                        "DeletionProtection",
                        "NodeRepairConfig",
                        "UpdatedTier",
                        "PreviousTier",
                        "WarmPoolEnabled",
                        "WarmPoolMaxGroupPreparedCapacity",
                        "WarmPoolMinSize",
                        "WarmPoolState",
                        "WarmPoolReuseOnScaleIn",
                      ],
                    },
                    value: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              createdAt: {
                type: "string",
              },
              errors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    errorCode: {
                      type: "string",
                      enum: [
                        "SubnetNotFound",
                        "SecurityGroupNotFound",
                        "EniLimitReached",
                        "IpNotAvailable",
                        "AccessDenied",
                        "OperationNotPermitted",
                        "VpcIdNotFound",
                        "Unknown",
                        "NodeCreationFailure",
                        "PodEvictionFailure",
                        "InsufficientFreeAddresses",
                        "ClusterUnreachable",
                        "InsufficientNumberOfReplicas",
                        "ConfigurationConflict",
                        "AdmissionRequestDenied",
                        "UnsupportedAddonModification",
                        "K8sResourceNotFound",
                      ],
                    },
                    errorMessage: {
                      type: "string",
                    },
                    resourceIds: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description: "An object representing an asynchronous update.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateNodegroupVersion;

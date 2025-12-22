import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, CreateClusterCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createCluster: AppBlock = {
  name: "Create Cluster",
  description: `Creates an Amazon EKS control plane.`,
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
        name: {
          name: "name",
          description: "The unique name to give to your cluster.",
          type: "string",
          required: true,
        },
        version: {
          name: "version",
          description: "The desired Kubernetes version for your cluster.",
          type: "string",
          required: false,
        },
        roleArn: {
          name: "role Arn",
          description:
            "The Amazon Resource Name (ARN) of the IAM role that provides permissions for the Kubernetes control plane to make calls to Amazon Web Services API operations on your behalf.",
          type: "string",
          required: true,
        },
        resourcesVpcConfig: {
          name: "resources Vpc Config",
          description:
            "The VPC configuration that's used by the cluster control plane.",
          type: {
            type: "object",
            properties: {
              subnetIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              securityGroupIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              endpointPublicAccess: {
                type: "boolean",
              },
              endpointPrivateAccess: {
                type: "boolean",
              },
              publicAccessCidrs: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
          },
          required: true,
        },
        kubernetesNetworkConfig: {
          name: "kubernetes Network Config",
          description: "The Kubernetes network configuration for the cluster.",
          type: {
            type: "object",
            properties: {
              serviceIpv4Cidr: {
                type: "string",
              },
              ipFamily: {
                type: "string",
              },
              elasticLoadBalancing: {
                type: "object",
                properties: {
                  enabled: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        logging: {
          name: "logging",
          description:
            "Enable or disable exporting the Kubernetes control plane logs for your cluster to CloudWatch Logs .",
          type: {
            type: "object",
            properties: {
              clusterLogging: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    types: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    enabled: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        clientRequestToken: {
          name: "client Request Token",
          description:
            "A unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        tags: {
          name: "tags",
          description:
            "Metadata that assists with categorization and organization.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        encryptionConfig: {
          name: "encryption Config",
          description: "The encryption configuration for the cluster.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                resources: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                provider: {
                  type: "object",
                  properties: {
                    keyArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        outpostConfig: {
          name: "outpost Config",
          description:
            "An object representing the configuration of your local Amazon EKS cluster on an Amazon Web Services Outpost.",
          type: {
            type: "object",
            properties: {
              outpostArns: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              controlPlaneInstanceType: {
                type: "string",
              },
              controlPlanePlacement: {
                type: "object",
                properties: {
                  groupName: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            required: ["outpostArns", "controlPlaneInstanceType"],
            additionalProperties: false,
          },
          required: false,
        },
        accessConfig: {
          name: "access Config",
          description: "The access configuration for the cluster.",
          type: {
            type: "object",
            properties: {
              bootstrapClusterCreatorAdminPermissions: {
                type: "boolean",
              },
              authenticationMode: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        bootstrapSelfManagedAddons: {
          name: "bootstrap Self Managed Addons",
          description:
            "If you set this value to False when creating a cluster, the default networking add-ons will not be installed.",
          type: "boolean",
          required: false,
        },
        upgradePolicy: {
          name: "upgrade Policy",
          description:
            "New clusters, by default, have extended support enabled.",
          type: {
            type: "object",
            properties: {
              supportType: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        zonalShiftConfig: {
          name: "zonal Shift Config",
          description: "Enable or disable ARC zonal shift for the cluster.",
          type: {
            type: "object",
            properties: {
              enabled: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        remoteNetworkConfig: {
          name: "remote Network Config",
          description: "The configuration in the cluster for EKS Hybrid Nodes.",
          type: {
            type: "object",
            properties: {
              remoteNodeNetworks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    cidrs: {
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
              remotePodNetworks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    cidrs: {
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
            },
            additionalProperties: false,
          },
          required: false,
        },
        computeConfig: {
          name: "compute Config",
          description:
            "Enable or disable the compute capability of EKS Auto Mode when creating your EKS Auto Mode cluster.",
          type: {
            type: "object",
            properties: {
              enabled: {
                type: "boolean",
              },
              nodePools: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              nodeRoleArn: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        storageConfig: {
          name: "storage Config",
          description:
            "Enable or disable the block storage capability of EKS Auto Mode when creating your EKS Auto Mode cluster.",
          type: {
            type: "object",
            properties: {
              blockStorage: {
                type: "object",
                properties: {
                  enabled: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
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

        const client = new EKSClient({
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
          cluster: {
            type: "object",
            properties: {
              name: {
                type: "string",
              },
              arn: {
                type: "string",
              },
              createdAt: {
                type: "string",
              },
              version: {
                type: "string",
              },
              endpoint: {
                type: "string",
              },
              roleArn: {
                type: "string",
              },
              resourcesVpcConfig: {
                type: "object",
                properties: {
                  subnetIds: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  securityGroupIds: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  clusterSecurityGroupId: {
                    type: "string",
                  },
                  vpcId: {
                    type: "string",
                  },
                  endpointPublicAccess: {
                    type: "boolean",
                  },
                  endpointPrivateAccess: {
                    type: "boolean",
                  },
                  publicAccessCidrs: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                additionalProperties: false,
              },
              kubernetesNetworkConfig: {
                type: "object",
                properties: {
                  serviceIpv4Cidr: {
                    type: "string",
                  },
                  serviceIpv6Cidr: {
                    type: "string",
                  },
                  ipFamily: {
                    type: "string",
                  },
                  elasticLoadBalancing: {
                    type: "object",
                    properties: {
                      enabled: {
                        type: "boolean",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              logging: {
                type: "object",
                properties: {
                  clusterLogging: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        types: {
                          type: "object",
                          additionalProperties: true,
                        },
                        enabled: {
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
              identity: {
                type: "object",
                properties: {
                  oidc: {
                    type: "object",
                    properties: {
                      issuer: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              status: {
                type: "string",
              },
              certificateAuthority: {
                type: "object",
                properties: {
                  data: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              clientRequestToken: {
                type: "string",
              },
              platformVersion: {
                type: "string",
              },
              tags: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
              encryptionConfig: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    resources: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    provider: {
                      type: "object",
                      properties: {
                        keyArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              connectorConfig: {
                type: "object",
                properties: {
                  activationId: {
                    type: "string",
                  },
                  activationCode: {
                    type: "string",
                  },
                  activationExpiry: {
                    type: "string",
                  },
                  provider: {
                    type: "string",
                  },
                  roleArn: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              id: {
                type: "string",
              },
              health: {
                type: "object",
                properties: {
                  issues: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        code: {
                          type: "object",
                          additionalProperties: true,
                        },
                        message: {
                          type: "object",
                          additionalProperties: true,
                        },
                        resourceIds: {
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
              outpostConfig: {
                type: "object",
                properties: {
                  outpostArns: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  controlPlaneInstanceType: {
                    type: "string",
                  },
                  controlPlanePlacement: {
                    type: "object",
                    properties: {
                      groupName: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                required: ["outpostArns", "controlPlaneInstanceType"],
                additionalProperties: false,
              },
              accessConfig: {
                type: "object",
                properties: {
                  bootstrapClusterCreatorAdminPermissions: {
                    type: "boolean",
                  },
                  authenticationMode: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              upgradePolicy: {
                type: "object",
                properties: {
                  supportType: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              zonalShiftConfig: {
                type: "object",
                properties: {
                  enabled: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              remoteNetworkConfig: {
                type: "object",
                properties: {
                  remoteNodeNetworks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        cidrs: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  remotePodNetworks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        cidrs: {
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
              computeConfig: {
                type: "object",
                properties: {
                  enabled: {
                    type: "boolean",
                  },
                  nodePools: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  nodeRoleArn: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              storageConfig: {
                type: "object",
                properties: {
                  blockStorage: {
                    type: "object",
                    properties: {
                      enabled: {
                        type: "boolean",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "The full description of your new cluster.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createCluster;

import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, DeleteClusterCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteCluster: AppBlock = {
  name: "Delete Cluster",
  description: `Deletes an Amazon EKS cluster control plane.`,
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
          description: "The name of the cluster to delete.",
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

        const command = new DeleteClusterCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Cluster Result",
      description: "Result from DeleteCluster operation",
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
            description: "The full description of the cluster to delete.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteCluster;

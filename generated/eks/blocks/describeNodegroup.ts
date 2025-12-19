import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, DescribeNodegroupCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeNodegroup: AppBlock = {
  name: "Describe Nodegroup",
  description: `Describes a managed node group.`,
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
          description: "The name of the node group to describe.",
          type: "string",
          required: true,
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

        const client = new EKSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeNodegroupCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Nodegroup Result",
      description: "Result from DescribeNodegroup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          nodegroup: {
            type: "object",
            properties: {
              nodegroupName: {
                type: "string",
              },
              nodegroupArn: {
                type: "string",
              },
              clusterName: {
                type: "string",
              },
              version: {
                type: "string",
              },
              releaseVersion: {
                type: "string",
              },
              createdAt: {
                type: "string",
              },
              modifiedAt: {
                type: "string",
              },
              status: {
                type: "string",
              },
              capacityType: {
                type: "string",
              },
              scalingConfig: {
                type: "object",
                properties: {
                  minSize: {
                    type: "number",
                  },
                  maxSize: {
                    type: "number",
                  },
                  desiredSize: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              instanceTypes: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              subnets: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              remoteAccess: {
                type: "object",
                properties: {
                  ec2SshKey: {
                    type: "string",
                  },
                  sourceSecurityGroups: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                additionalProperties: false,
              },
              amiType: {
                type: "string",
              },
              nodeRole: {
                type: "string",
              },
              labels: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
              taints: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: {
                      type: "string",
                    },
                    value: {
                      type: "string",
                    },
                    effect: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              resources: {
                type: "object",
                properties: {
                  autoScalingGroups: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  remoteAccessSecurityGroup: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              diskSize: {
                type: "number",
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
              updateConfig: {
                type: "object",
                properties: {
                  maxUnavailable: {
                    type: "number",
                  },
                  maxUnavailablePercentage: {
                    type: "number",
                  },
                  updateStrategy: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              nodeRepairConfig: {
                type: "object",
                properties: {
                  enabled: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              launchTemplate: {
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
              tags: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
            description: "The full description of your node group.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeNodegroup;

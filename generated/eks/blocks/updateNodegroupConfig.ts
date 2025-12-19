import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, UpdateNodegroupConfigCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateNodegroupConfig: AppBlock = {
  name: "Update Nodegroup Config",
  description: `Updates an Amazon EKS managed node group configuration.`,
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
        labels: {
          name: "labels",
          description:
            "The Kubernetes labels to apply to the nodes in the node group after the update.",
          type: {
            type: "object",
            properties: {
              addOrUpdateLabels: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
              removeLabels: {
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
        taints: {
          name: "taints",
          description:
            "The Kubernetes taints to be applied to the nodes in the node group after the update.",
          type: {
            type: "object",
            properties: {
              addOrUpdateTaints: {
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
              removeTaints: {
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
            },
            additionalProperties: false,
          },
          required: false,
        },
        scalingConfig: {
          name: "scaling Config",
          description:
            "The scaling configuration details for the Auto Scaling group after the update.",
          type: {
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
          required: false,
        },
        updateConfig: {
          name: "update Config",
          description: "The node group update configuration.",
          type: {
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
          required: false,
        },
        nodeRepairConfig: {
          name: "node Repair Config",
          description: "The node auto repair configuration for the node group.",
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

        const command = new UpdateNodegroupConfigCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Nodegroup Config Result",
      description: "Result from UpdateNodegroupConfig operation",
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
              },
              type: {
                type: "string",
              },
              params: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
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
                    },
                    errorMessage: {
                      type: "string",
                    },
                    resourceIds: {
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
            description: "An object representing an asynchronous update.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateNodegroupConfig;

import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, DeleteAddonCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteAddon: AppBlock = {
  name: "Delete Addon",
  description: `Deletes an Amazon EKS add-on.`,
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
        addonName: {
          name: "addon Name",
          description: "The name of the add-on.",
          type: "string",
          required: true,
        },
        preserve: {
          name: "preserve",
          description:
            "Specifying this option preserves the add-on software on your cluster but Amazon EKS stops managing any settings for the add-on.",
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

        const command = new DeleteAddonCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Addon Result",
      description: "Result from DeleteAddon operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          addon: {
            type: "object",
            properties: {
              addonName: {
                type: "string",
              },
              clusterName: {
                type: "string",
              },
              status: {
                type: "string",
                enum: [
                  "CREATING",
                  "ACTIVE",
                  "CREATE_FAILED",
                  "UPDATING",
                  "DELETING",
                  "DELETE_FAILED",
                  "DEGRADED",
                  "UPDATE_FAILED",
                ],
              },
              addonVersion: {
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
                          type: "string",
                          enum: [
                            "AccessDenied",
                            "InternalFailure",
                            "ClusterUnreachable",
                            "InsufficientNumberOfReplicas",
                            "ConfigurationConflict",
                            "AdmissionRequestDenied",
                            "UnsupportedAddonModification",
                            "K8sResourceNotFound",
                            "AddonSubscriptionNeeded",
                            "AddonPermissionFailure",
                          ],
                        },
                        message: {
                          type: "string",
                        },
                        resourceIds: {
                          type: "array",
                          items: {},
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
              addonArn: {
                type: "string",
              },
              createdAt: {
                type: "string",
              },
              modifiedAt: {
                type: "string",
              },
              serviceAccountRoleArn: {
                type: "string",
              },
              tags: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
              publisher: {
                type: "string",
              },
              owner: {
                type: "string",
              },
              marketplaceInformation: {
                type: "object",
                properties: {
                  productId: {
                    type: "string",
                  },
                  productUrl: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              configurationValues: {
                type: "string",
              },
              podIdentityAssociations: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              namespaceConfig: {
                type: "object",
                properties: {
                  namespace: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "An Amazon EKS add-on.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteAddon;

import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, CreateAddonCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createAddon: AppBlock = {
  name: "Create Addon",
  description: `Creates an Amazon EKS add-on.`,
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
        addonVersion: {
          name: "addon Version",
          description: "The version of the add-on.",
          type: "string",
          required: false,
        },
        serviceAccountRoleArn: {
          name: "service Account Role Arn",
          description:
            "The Amazon Resource Name (ARN) of an existing IAM role to bind to the add-on's service account.",
          type: "string",
          required: false,
        },
        resolveConflicts: {
          name: "resolve Conflicts",
          description:
            "How to resolve field value conflicts for an Amazon EKS add-on.",
          type: "string",
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
        configurationValues: {
          name: "configuration Values",
          description:
            "The set of configuration values for the add-on that's created.",
          type: "string",
          required: false,
        },
        podIdentityAssociations: {
          name: "pod Identity Associations",
          description:
            "An array of EKS Pod Identity associations to be created.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                serviceAccount: {
                  type: "string",
                },
                roleArn: {
                  type: "string",
                },
              },
              required: ["serviceAccount", "roleArn"],
              additionalProperties: false,
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

        const client = new EKSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateAddonCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Addon Result",
      description: "Result from CreateAddon operation",
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

export default createAddon;

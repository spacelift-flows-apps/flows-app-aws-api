import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, UpdateCapabilityCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateCapability: AppBlock = {
  name: "Update Capability",
  description: `Updates the configuration of a managed capability in your Amazon EKS cluster.`,
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
          description:
            "The name of the Amazon EKS cluster that contains the capability you want to update configuration for.",
          type: "string",
          required: true,
        },
        capabilityName: {
          name: "capability Name",
          description:
            "The name of the capability to update configuration for.",
          type: "string",
          required: true,
        },
        roleArn: {
          name: "role Arn",
          description:
            "The Amazon Resource Name (ARN) of the IAM role that the capability uses to interact with Amazon Web Services services.",
          type: "string",
          required: false,
        },
        configuration: {
          name: "configuration",
          description: "The updated configuration settings for the capability.",
          type: {
            type: "object",
            properties: {
              argoCd: {
                type: "object",
                properties: {
                  rbacRoleMappings: {
                    type: "object",
                    properties: {
                      addOrUpdateRoleMappings: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            role: {},
                            identities: {},
                          },
                          required: ["role", "identities"],
                          additionalProperties: false,
                        },
                      },
                      removeRoleMappings: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            role: {},
                            identities: {},
                          },
                          required: ["role", "identities"],
                          additionalProperties: false,
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                  networkAccess: {
                    type: "object",
                    properties: {
                      vpceIds: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
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
        deletePropagationPolicy: {
          name: "delete Propagation Policy",
          description:
            "The updated delete propagation policy for the capability.",
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

        const command = new UpdateCapabilityCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Capability Result",
      description: "Result from UpdateCapability operation",
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

export default updateCapability;

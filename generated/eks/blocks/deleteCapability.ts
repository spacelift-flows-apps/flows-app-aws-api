import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, DeleteCapabilityCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteCapability: AppBlock = {
  name: "Delete Capability",
  description: `Deletes a managed capability from your Amazon EKS cluster.`,
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
            "The name of the Amazon EKS cluster that contains the capability you want to delete.",
          type: "string",
          required: true,
        },
        capabilityName: {
          name: "capability Name",
          description: "The name of the capability to delete.",
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

        const command = new DeleteCapabilityCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Capability Result",
      description: "Result from DeleteCapability operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          capability: {
            type: "object",
            properties: {
              capabilityName: {
                type: "string",
              },
              arn: {
                type: "string",
              },
              clusterName: {
                type: "string",
              },
              type: {
                type: "string",
                enum: ["ACK", "KRO", "ARGOCD"],
              },
              roleArn: {
                type: "string",
              },
              status: {
                type: "string",
                enum: [
                  "CREATING",
                  "CREATE_FAILED",
                  "UPDATING",
                  "DELETING",
                  "DELETE_FAILED",
                  "ACTIVE",
                  "DEGRADED",
                ],
              },
              version: {
                type: "string",
              },
              configuration: {
                type: "object",
                properties: {
                  argoCd: {
                    type: "object",
                    properties: {
                      namespace: {
                        type: "string",
                      },
                      awsIdc: {
                        type: "object",
                        properties: {
                          idcInstanceArn: {
                            type: "string",
                          },
                          idcRegion: {
                            type: "string",
                          },
                          idcManagedApplicationArn: {
                            type: "string",
                          },
                        },
                        additionalProperties: false,
                      },
                      rbacRoleMappings: {
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
                      networkAccess: {
                        type: "object",
                        properties: {
                          vpceIds: {
                            type: "array",
                            items: {},
                          },
                        },
                        additionalProperties: false,
                      },
                      serverUrl: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
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
                          enum: ["AccessDenied", "ClusterUnreachable"],
                        },
                        message: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
              createdAt: {
                type: "string",
              },
              modifiedAt: {
                type: "string",
              },
              deletePropagationPolicy: {
                type: "string",
                enum: ["RETAIN"],
              },
            },
            additionalProperties: false,
            description:
              "An object containing information about the deleted capability, including its final status and configuration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteCapability;

import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, UpdateClusterSettingsCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateClusterSettings: AppBlock = {
  name: "Update Cluster Settings",
  description: `Modifies the settings to use for a cluster.`,
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
        cluster: {
          name: "cluster",
          description: "The name of the cluster to modify the settings for.",
          type: "string",
          required: true,
        },
        settings: {
          name: "settings",
          description: "The setting to use by default for a cluster.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                value: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
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

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateClusterSettingsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Cluster Settings Result",
      description: "Result from UpdateClusterSettings operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          cluster: {
            type: "object",
            properties: {
              clusterArn: {
                type: "string",
              },
              clusterName: {
                type: "string",
              },
              configuration: {
                type: "object",
                properties: {
                  executeCommandConfiguration: {
                    type: "object",
                    properties: {
                      kmsKeyId: {
                        type: "string",
                      },
                      logging: {
                        type: "string",
                      },
                      logConfiguration: {
                        type: "object",
                        properties: {
                          cloudWatchLogGroupName: {
                            type: "object",
                            additionalProperties: true,
                          },
                          cloudWatchEncryptionEnabled: {
                            type: "object",
                            additionalProperties: true,
                          },
                          s3BucketName: {
                            type: "object",
                            additionalProperties: true,
                          },
                          s3EncryptionEnabled: {
                            type: "object",
                            additionalProperties: true,
                          },
                          s3KeyPrefix: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                    },
                    additionalProperties: false,
                  },
                  managedStorageConfiguration: {
                    type: "object",
                    properties: {
                      kmsKeyId: {
                        type: "string",
                      },
                      fargateEphemeralStorageKmsKeyId: {
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
              registeredContainerInstancesCount: {
                type: "number",
              },
              runningTasksCount: {
                type: "number",
              },
              pendingTasksCount: {
                type: "number",
              },
              activeServicesCount: {
                type: "number",
              },
              statistics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    value: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              tags: {
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
                  },
                  additionalProperties: false,
                },
              },
              settings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    value: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              capacityProviders: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              defaultCapacityProviderStrategy: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    capacityProvider: {
                      type: "string",
                    },
                    weight: {
                      type: "number",
                    },
                    base: {
                      type: "number",
                    },
                  },
                  required: ["capacityProvider"],
                  additionalProperties: false,
                },
              },
              attachments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                    },
                    type: {
                      type: "string",
                    },
                    status: {
                      type: "string",
                    },
                    details: {
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
              attachmentsStatus: {
                type: "string",
              },
              serviceConnectDefaults: {
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
            description: "Details about the cluster",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateClusterSettings;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECSClient,
  DescribeContainerInstancesCommand,
} from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeContainerInstances: AppBlock = {
  name: "Describe Container Instances",
  description: `Describes one or more container instances.`,
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
          description:
            "The short name or full Amazon Resource Name (ARN) of the cluster that hosts the container instances to describe.",
          type: "string",
          required: false,
        },
        containerInstances: {
          name: "container Instances",
          description:
            "A list of up to 100 container instance IDs or full Amazon Resource Name (ARN) entries.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        include: {
          name: "include",
          description:
            "Specifies whether you want to see the resource tags for the container instance.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeContainerInstancesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Container Instances Result",
      description: "Result from DescribeContainerInstances operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          containerInstances: {
            type: "array",
            items: {
              type: "object",
              properties: {
                containerInstanceArn: {
                  type: "string",
                },
                ec2InstanceId: {
                  type: "string",
                },
                capacityProviderName: {
                  type: "string",
                },
                version: {
                  type: "number",
                },
                versionInfo: {
                  type: "object",
                  properties: {
                    agentVersion: {
                      type: "string",
                    },
                    agentHash: {
                      type: "string",
                    },
                    dockerVersion: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                remainingResources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      type: {
                        type: "object",
                        additionalProperties: true,
                      },
                      doubleValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      longValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      integerValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      stringSetValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                registeredResources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      type: {
                        type: "object",
                        additionalProperties: true,
                      },
                      doubleValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      longValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      integerValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      stringSetValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                status: {
                  type: "string",
                },
                statusReason: {
                  type: "string",
                },
                agentConnected: {
                  type: "boolean",
                },
                runningTasksCount: {
                  type: "number",
                },
                pendingTasksCount: {
                  type: "number",
                },
                agentUpdateStatus: {
                  type: "string",
                },
                attributes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      value: {
                        type: "object",
                        additionalProperties: true,
                      },
                      targetType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      targetId: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["name"],
                    additionalProperties: false,
                  },
                },
                registeredAt: {
                  type: "string",
                },
                attachments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "object",
                        additionalProperties: true,
                      },
                      type: {
                        type: "object",
                        additionalProperties: true,
                      },
                      status: {
                        type: "object",
                        additionalProperties: true,
                      },
                      details: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                healthStatus: {
                  type: "object",
                  properties: {
                    overallStatus: {
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
              additionalProperties: false,
            },
            description: "The list of container instances.",
          },
          failures: {
            type: "array",
            items: {
              type: "object",
              properties: {
                arn: {
                  type: "string",
                },
                reason: {
                  type: "string",
                },
                detail: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Any failures associated with the call.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeContainerInstances;

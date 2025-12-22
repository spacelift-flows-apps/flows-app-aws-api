import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, DescribeTaskSetsCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeTaskSets: AppBlock = {
  name: "Describe Task Sets",
  description: `Describes the task sets in the specified cluster and service.`,
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
            "The short name or full Amazon Resource Name (ARN) of the cluster that hosts the service that the task sets exist in.",
          type: "string",
          required: true,
        },
        service: {
          name: "service",
          description:
            "The short name or full Amazon Resource Name (ARN) of the service that the task sets exist in.",
          type: "string",
          required: true,
        },
        taskSets: {
          name: "task Sets",
          description:
            "The ID or full Amazon Resource Name (ARN) of task sets to describe.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        include: {
          name: "include",
          description:
            "Specifies whether to see the resource tags for the task set.",
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
        }

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeTaskSetsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Task Sets Result",
      description: "Result from DescribeTaskSets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          taskSets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                },
                taskSetArn: {
                  type: "string",
                },
                serviceArn: {
                  type: "string",
                },
                clusterArn: {
                  type: "string",
                },
                startedBy: {
                  type: "string",
                },
                externalId: {
                  type: "string",
                },
                status: {
                  type: "string",
                },
                taskDefinition: {
                  type: "string",
                },
                computedDesiredCount: {
                  type: "number",
                },
                pendingCount: {
                  type: "number",
                },
                runningCount: {
                  type: "number",
                },
                createdAt: {
                  type: "string",
                },
                updatedAt: {
                  type: "string",
                },
                launchType: {
                  type: "string",
                },
                capacityProviderStrategy: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      capacityProvider: {
                        type: "object",
                        additionalProperties: true,
                      },
                      weight: {
                        type: "object",
                        additionalProperties: true,
                      },
                      base: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["capacityProvider"],
                    additionalProperties: false,
                  },
                },
                platformVersion: {
                  type: "string",
                },
                platformFamily: {
                  type: "string",
                },
                networkConfiguration: {
                  type: "object",
                  properties: {
                    awsvpcConfiguration: {
                      type: "object",
                      properties: {
                        subnets: {
                          type: "object",
                          additionalProperties: true,
                        },
                        securityGroups: {
                          type: "object",
                          additionalProperties: true,
                        },
                        assignPublicIp: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["subnets"],
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                loadBalancers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      targetGroupArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      loadBalancerName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      containerName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      containerPort: {
                        type: "object",
                        additionalProperties: true,
                      },
                      advancedConfiguration: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                serviceRegistries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      registryArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      port: {
                        type: "object",
                        additionalProperties: true,
                      },
                      containerName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      containerPort: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                scale: {
                  type: "object",
                  properties: {
                    value: {
                      type: "number",
                    },
                    unit: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                stabilityStatus: {
                  type: "string",
                },
                stabilityStatusAt: {
                  type: "string",
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
                fargateEphemeralStorage: {
                  type: "object",
                  properties: {
                    kmsKeyId: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "The list of task sets described.",
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

export default describeTaskSets;

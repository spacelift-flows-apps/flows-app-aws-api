import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, DescribeServicesCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeServices: AppBlock = {
  name: "Describe Services",
  description: `Describes the specified services running in your cluster.`,
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
            "The short name or full Amazon Resource Name (ARN)the cluster that hosts the service to describe.",
          type: "string",
          required: false,
        },
        services: {
          name: "services",
          description: "A list of services to describe.",
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
            "Determines whether you want to see the resource tags for the service.",
          type: {
            type: "array",
            items: {
              type: "string",
              enum: ["TAGS"],
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

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeServicesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Services Result",
      description: "Result from DescribeServices operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          services: {
            type: "array",
            items: {
              type: "object",
              properties: {
                serviceArn: {
                  type: "string",
                },
                serviceName: {
                  type: "string",
                },
                clusterArn: {
                  type: "string",
                },
                loadBalancers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      targetGroupArn: {
                        type: "string",
                      },
                      loadBalancerName: {
                        type: "string",
                      },
                      containerName: {
                        type: "string",
                      },
                      containerPort: {
                        type: "number",
                      },
                      advancedConfiguration: {
                        type: "object",
                        properties: {
                          alternateTargetGroupArn: {},
                          productionListenerRule: {},
                          testListenerRule: {},
                          roleArn: {},
                        },
                        additionalProperties: false,
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
                        type: "string",
                      },
                      port: {
                        type: "number",
                      },
                      containerName: {
                        type: "string",
                      },
                      containerPort: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                status: {
                  type: "string",
                },
                desiredCount: {
                  type: "number",
                },
                runningCount: {
                  type: "number",
                },
                pendingCount: {
                  type: "number",
                },
                launchType: {
                  type: "string",
                  enum: ["EC2", "FARGATE", "EXTERNAL", "MANAGED_INSTANCES"],
                },
                capacityProviderStrategy: {
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
                platformVersion: {
                  type: "string",
                },
                platformFamily: {
                  type: "string",
                },
                taskDefinition: {
                  type: "string",
                },
                deploymentConfiguration: {
                  type: "object",
                  properties: {
                    deploymentCircuitBreaker: {
                      type: "object",
                      properties: {
                        enable: {
                          type: "boolean",
                        },
                        rollback: {
                          type: "boolean",
                        },
                      },
                      required: ["enable", "rollback"],
                      additionalProperties: false,
                    },
                    maximumPercent: {
                      type: "number",
                    },
                    minimumHealthyPercent: {
                      type: "number",
                    },
                    alarms: {
                      type: "object",
                      properties: {
                        alarmNames: {
                          type: "array",
                          items: {},
                        },
                        rollback: {
                          type: "boolean",
                        },
                        enable: {
                          type: "boolean",
                        },
                      },
                      required: ["alarmNames", "rollback", "enable"],
                      additionalProperties: false,
                    },
                    strategy: {
                      type: "string",
                      enum: ["ROLLING", "BLUE_GREEN", "LINEAR", "CANARY"],
                    },
                    bakeTimeInMinutes: {
                      type: "number",
                    },
                    lifecycleHooks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          hookTargetArn: {},
                          roleArn: {},
                          lifecycleStages: {},
                          hookDetails: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    linearConfiguration: {
                      type: "object",
                      properties: {
                        stepPercent: {
                          type: "number",
                        },
                        stepBakeTimeInMinutes: {
                          type: "number",
                        },
                      },
                      additionalProperties: false,
                    },
                    canaryConfiguration: {
                      type: "object",
                      properties: {
                        canaryPercent: {
                          type: "number",
                        },
                        canaryBakeTimeInMinutes: {
                          type: "number",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
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
                        enum: [
                          "EC2",
                          "FARGATE",
                          "EXTERNAL",
                          "MANAGED_INSTANCES",
                        ],
                      },
                      capacityProviderStrategy: {
                        type: "array",
                        items: {},
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
                          awsvpcConfiguration: {},
                        },
                        additionalProperties: false,
                      },
                      loadBalancers: {
                        type: "array",
                        items: {},
                      },
                      serviceRegistries: {
                        type: "array",
                        items: {},
                      },
                      scale: {
                        type: "object",
                        properties: {
                          value: {},
                          unit: {},
                        },
                        additionalProperties: false,
                      },
                      stabilityStatus: {
                        type: "string",
                        enum: ["STEADY_STATE", "STABILIZING"],
                      },
                      stabilityStatusAt: {
                        type: "string",
                      },
                      tags: {
                        type: "array",
                        items: {},
                      },
                      fargateEphemeralStorage: {
                        type: "object",
                        properties: {
                          kmsKeyId: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                deployments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                      },
                      status: {
                        type: "string",
                      },
                      taskDefinition: {
                        type: "string",
                      },
                      desiredCount: {
                        type: "number",
                      },
                      pendingCount: {
                        type: "number",
                      },
                      runningCount: {
                        type: "number",
                      },
                      failedTasks: {
                        type: "number",
                      },
                      createdAt: {
                        type: "string",
                      },
                      updatedAt: {
                        type: "string",
                      },
                      capacityProviderStrategy: {
                        type: "array",
                        items: {},
                      },
                      launchType: {
                        type: "string",
                        enum: [
                          "EC2",
                          "FARGATE",
                          "EXTERNAL",
                          "MANAGED_INSTANCES",
                        ],
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
                          awsvpcConfiguration: {},
                        },
                        additionalProperties: false,
                      },
                      rolloutState: {
                        type: "string",
                        enum: ["COMPLETED", "FAILED", "IN_PROGRESS"],
                      },
                      rolloutStateReason: {
                        type: "string",
                      },
                      serviceConnectConfiguration: {
                        type: "object",
                        properties: {
                          enabled: {},
                          namespace: {},
                          services: {},
                          logConfiguration: {},
                          accessLogConfiguration: {},
                        },
                        required: ["enabled"],
                        additionalProperties: false,
                      },
                      serviceConnectResources: {
                        type: "array",
                        items: {},
                      },
                      volumeConfigurations: {
                        type: "array",
                        items: {},
                      },
                      fargateEphemeralStorage: {
                        type: "object",
                        properties: {
                          kmsKeyId: {},
                        },
                        additionalProperties: false,
                      },
                      vpcLatticeConfigurations: {
                        type: "array",
                        items: {},
                      },
                    },
                    additionalProperties: false,
                  },
                },
                roleArn: {
                  type: "string",
                },
                events: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                      },
                      createdAt: {
                        type: "string",
                      },
                      message: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                createdAt: {
                  type: "string",
                },
                currentServiceDeployment: {
                  type: "string",
                },
                currentServiceRevisions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      arn: {
                        type: "string",
                      },
                      requestedTaskCount: {
                        type: "number",
                      },
                      runningTaskCount: {
                        type: "number",
                      },
                      pendingTaskCount: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                placementConstraints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["distinctInstance", "memberOf"],
                      },
                      expression: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                placementStrategy: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["random", "spread", "binpack"],
                      },
                      field: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                networkConfiguration: {
                  type: "object",
                  properties: {
                    awsvpcConfiguration: {
                      type: "object",
                      properties: {
                        subnets: {
                          type: "array",
                          items: {},
                        },
                        securityGroups: {
                          type: "array",
                          items: {},
                        },
                        assignPublicIp: {
                          type: "string",
                          enum: ["ENABLED", "DISABLED"],
                        },
                      },
                      required: ["subnets"],
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                healthCheckGracePeriodSeconds: {
                  type: "number",
                },
                schedulingStrategy: {
                  type: "string",
                  enum: ["REPLICA", "DAEMON"],
                },
                deploymentController: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["ECS", "CODE_DEPLOY", "EXTERNAL"],
                    },
                  },
                  required: ["type"],
                  additionalProperties: false,
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
                createdBy: {
                  type: "string",
                },
                enableECSManagedTags: {
                  type: "boolean",
                },
                propagateTags: {
                  type: "string",
                  enum: ["TASK_DEFINITION", "SERVICE", "NONE"],
                },
                enableExecuteCommand: {
                  type: "boolean",
                },
                availabilityZoneRebalancing: {
                  type: "string",
                  enum: ["ENABLED", "DISABLED"],
                },
                resourceManagementType: {
                  type: "string",
                  enum: ["CUSTOMER", "ECS"],
                },
              },
              additionalProperties: false,
            },
            description: "The list of services described.",
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

export default describeServices;

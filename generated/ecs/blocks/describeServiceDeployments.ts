import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECSClient,
  DescribeServiceDeploymentsCommand,
} from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeServiceDeployments: AppBlock = {
  name: "Describe Service Deployments",
  description: `Describes one or more of your service deployments.`,
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
        serviceDeploymentArns: {
          name: "service Deployment Arns",
          description: "The ARN of the service deployment.",
          type: {
            type: "array",
            items: {
              type: "string",
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

        const command = new DescribeServiceDeploymentsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Service Deployments Result",
      description: "Result from DescribeServiceDeployments operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          serviceDeployments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                serviceDeploymentArn: {
                  type: "string",
                },
                serviceArn: {
                  type: "string",
                },
                clusterArn: {
                  type: "string",
                },
                createdAt: {
                  type: "string",
                },
                startedAt: {
                  type: "string",
                },
                finishedAt: {
                  type: "string",
                },
                stoppedAt: {
                  type: "string",
                },
                updatedAt: {
                  type: "string",
                },
                sourceServiceRevisions: {
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
                      requestedTestTrafficWeight: {
                        type: "number",
                      },
                      requestedProductionTrafficWeight: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                targetServiceRevision: {
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
                    requestedTestTrafficWeight: {
                      type: "number",
                    },
                    requestedProductionTrafficWeight: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                status: {
                  type: "string",
                  enum: [
                    "PENDING",
                    "SUCCESSFUL",
                    "STOPPED",
                    "STOP_REQUESTED",
                    "IN_PROGRESS",
                    "ROLLBACK_REQUESTED",
                    "ROLLBACK_IN_PROGRESS",
                    "ROLLBACK_SUCCESSFUL",
                    "ROLLBACK_FAILED",
                  ],
                },
                statusReason: {
                  type: "string",
                },
                lifecycleStage: {
                  type: "string",
                  enum: [
                    "RECONCILE_SERVICE",
                    "PRE_SCALE_UP",
                    "SCALE_UP",
                    "POST_SCALE_UP",
                    "TEST_TRAFFIC_SHIFT",
                    "POST_TEST_TRAFFIC_SHIFT",
                    "PRODUCTION_TRAFFIC_SHIFT",
                    "POST_PRODUCTION_TRAFFIC_SHIFT",
                    "BAKE_TIME",
                    "CLEAN_UP",
                  ],
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
                rollback: {
                  type: "object",
                  properties: {
                    reason: {
                      type: "string",
                    },
                    startedAt: {
                      type: "string",
                    },
                    serviceRevisionArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                deploymentCircuitBreaker: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      enum: [
                        "TRIGGERED",
                        "MONITORING",
                        "MONITORING_COMPLETE",
                        "DISABLED",
                      ],
                    },
                    failureCount: {
                      type: "number",
                    },
                    threshold: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                alarms: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      enum: [
                        "TRIGGERED",
                        "MONITORING",
                        "MONITORING_COMPLETE",
                        "DISABLED",
                      ],
                    },
                    alarmNames: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                    },
                    triggeredAlarmNames: {
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
            description: "The list of service deployments described.",
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

export default describeServiceDeployments;

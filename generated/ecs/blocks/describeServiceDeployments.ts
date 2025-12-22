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
                        type: "object",
                        additionalProperties: true,
                      },
                      requestedTaskCount: {
                        type: "object",
                        additionalProperties: true,
                      },
                      runningTaskCount: {
                        type: "object",
                        additionalProperties: true,
                      },
                      pendingTaskCount: {
                        type: "object",
                        additionalProperties: true,
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
                  },
                  additionalProperties: false,
                },
                status: {
                  type: "string",
                },
                statusReason: {
                  type: "string",
                },
                lifecycleStage: {
                  type: "string",
                },
                deploymentConfiguration: {
                  type: "object",
                  properties: {
                    deploymentCircuitBreaker: {
                      type: "object",
                      properties: {
                        enable: {
                          type: "object",
                          additionalProperties: true,
                        },
                        rollback: {
                          type: "object",
                          additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        rollback: {
                          type: "object",
                          additionalProperties: true,
                        },
                        enable: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["alarmNames", "rollback", "enable"],
                      additionalProperties: false,
                    },
                    strategy: {
                      type: "string",
                    },
                    bakeTimeInMinutes: {
                      type: "number",
                    },
                    lifecycleHooks: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
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
                    },
                    alarmNames: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    triggeredAlarmNames: {
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

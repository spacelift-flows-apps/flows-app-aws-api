import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECSClient,
  DescribeDaemonDeploymentsCommand,
} from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDaemonDeployments: AppBlock = {
  name: "Describe Daemon Deployments",
  description: `Describes one or more of your daemon deployments.`,
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
        daemonDeploymentArns: {
          name: "daemon Deployment Arns",
          description: "The ARN of the daemon deployments to describe.",
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

        const command = new DescribeDaemonDeploymentsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Daemon Deployments Result",
      description: "Result from DescribeDaemonDeployments operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
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
          daemonDeployments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                daemonDeploymentArn: {
                  type: "string",
                },
                clusterArn: {
                  type: "string",
                },
                status: {
                  type: "string",
                },
                statusReason: {
                  type: "string",
                },
                targetDaemonRevision: {
                  type: "object",
                  properties: {
                    arn: {
                      type: "string",
                    },
                    capacityProviders: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          arn: {},
                          runningInstanceCount: {},
                          drainingInstanceCount: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    totalRunningInstanceCount: {
                      type: "number",
                    },
                    totalDrainingInstanceCount: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                sourceDaemonRevisions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      arn: {
                        type: "string",
                      },
                      capacityProviders: {
                        type: "array",
                        items: {},
                      },
                      totalRunningInstanceCount: {
                        type: "number",
                      },
                      totalDrainingInstanceCount: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                circuitBreaker: {
                  type: "object",
                  properties: {
                    failureCount: {
                      type: "number",
                    },
                    status: {
                      type: "string",
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
                rollback: {
                  type: "object",
                  properties: {
                    reason: {
                      type: "string",
                    },
                    startedAt: {
                      type: "string",
                    },
                    rollbackTargetDaemonRevisionArn: {
                      type: "string",
                    },
                    rollbackCapacityProviders: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                    },
                  },
                  additionalProperties: false,
                },
                deploymentConfiguration: {
                  type: "object",
                  properties: {
                    drainPercent: {
                      type: "number",
                    },
                    alarms: {
                      type: "object",
                      properties: {
                        alarmNames: {
                          type: "array",
                          items: {},
                        },
                        enable: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                    bakeTimeInMinutes: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                createdAt: {
                  type: "string",
                },
                startedAt: {
                  type: "string",
                },
                stoppedAt: {
                  type: "string",
                },
                finishedAt: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The list of daemon deployments.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDaemonDeployments;

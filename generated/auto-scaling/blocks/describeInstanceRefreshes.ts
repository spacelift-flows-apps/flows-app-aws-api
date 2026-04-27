import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  DescribeInstanceRefreshesCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeInstanceRefreshes: AppBlock = {
  name: "Describe Instance Refreshes",
  description: `Gets information about the instance refreshes for the specified Auto Scaling group from the previous six weeks.`,
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
        AutoScalingGroupName: {
          name: "Auto Scaling Group Name",
          description: "The name of the Auto Scaling group.",
          type: "string",
          required: true,
        },
        InstanceRefreshIds: {
          name: "Instance Refresh Ids",
          description: "One or more instance refresh IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description: "The maximum number of items to return with this call.",
          type: "number",
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

        const client = new AutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeInstanceRefreshesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Instance Refreshes Result",
      description: "Result from DescribeInstanceRefreshes operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceRefreshes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                InstanceRefreshId: {
                  type: "string",
                },
                AutoScalingGroupName: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                StatusReason: {
                  type: "string",
                },
                StartTime: {
                  type: "string",
                },
                EndTime: {
                  type: "string",
                },
                PercentageComplete: {
                  type: "number",
                },
                InstancesToUpdate: {
                  type: "number",
                },
                ProgressDetails: {
                  type: "object",
                  properties: {
                    LivePoolProgress: {
                      type: "object",
                      properties: {
                        PercentageComplete: {
                          type: "object",
                          additionalProperties: true,
                        },
                        InstancesToUpdate: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    WarmPoolProgress: {
                      type: "object",
                      properties: {
                        PercentageComplete: {
                          type: "object",
                          additionalProperties: true,
                        },
                        InstancesToUpdate: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                Preferences: {
                  type: "object",
                  properties: {
                    MinHealthyPercentage: {
                      type: "number",
                    },
                    InstanceWarmup: {
                      type: "number",
                    },
                    CheckpointPercentages: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    CheckpointDelay: {
                      type: "number",
                    },
                    SkipMatching: {
                      type: "boolean",
                    },
                    AutoRollback: {
                      type: "boolean",
                    },
                    ScaleInProtectedInstances: {
                      type: "string",
                    },
                    StandbyInstances: {
                      type: "string",
                    },
                    AlarmSpecification: {
                      type: "object",
                      properties: {
                        Alarms: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    MaxHealthyPercentage: {
                      type: "number",
                    },
                    BakeTime: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                DesiredConfiguration: {
                  type: "object",
                  properties: {
                    LaunchTemplate: {
                      type: "object",
                      properties: {
                        LaunchTemplateId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        LaunchTemplateName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Version: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    MixedInstancesPolicy: {
                      type: "object",
                      properties: {
                        LaunchTemplate: {
                          type: "object",
                          additionalProperties: true,
                        },
                        InstancesDistribution: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                RollbackDetails: {
                  type: "object",
                  properties: {
                    RollbackReason: {
                      type: "string",
                    },
                    RollbackStartTime: {
                      type: "string",
                    },
                    PercentageCompleteOnRollback: {
                      type: "number",
                    },
                    InstancesToUpdateOnRollback: {
                      type: "number",
                    },
                    ProgressDetailsOnRollback: {
                      type: "object",
                      properties: {
                        LivePoolProgress: {
                          type: "object",
                          additionalProperties: true,
                        },
                        WarmPoolProgress: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                Strategy: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "The instance refreshes for the specified group, sorted by creation timestamp in descending order.",
          },
          NextToken: {
            type: "string",
            description:
              "A string that indicates that the response contains more items than can be returned in a single response.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeInstanceRefreshes;

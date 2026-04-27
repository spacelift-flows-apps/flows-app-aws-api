import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  StartInstanceRefreshCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startInstanceRefresh: AppBlock = {
  name: "Start Instance Refresh",
  description: `Starts an instance refresh.`,
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
        Strategy: {
          name: "Strategy",
          description: "The strategy to use for the instance refresh.",
          type: "string",
          required: false,
        },
        DesiredConfiguration: {
          name: "Desired Configuration",
          description: "The desired configuration.",
          type: {
            type: "object",
            properties: {
              LaunchTemplate: {
                type: "object",
                properties: {
                  LaunchTemplateId: {
                    type: "string",
                  },
                  LaunchTemplateName: {
                    type: "string",
                  },
                  Version: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              MixedInstancesPolicy: {
                type: "object",
                properties: {
                  LaunchTemplate: {
                    type: "object",
                    properties: {
                      LaunchTemplateSpecification: {
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
                      Overrides: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                  InstancesDistribution: {
                    type: "object",
                    properties: {
                      OnDemandAllocationStrategy: {
                        type: "string",
                      },
                      OnDemandBaseCapacity: {
                        type: "number",
                      },
                      OnDemandPercentageAboveBaseCapacity: {
                        type: "number",
                      },
                      SpotAllocationStrategy: {
                        type: "string",
                      },
                      SpotInstancePools: {
                        type: "number",
                      },
                      SpotMaxPrice: {
                        type: "string",
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
        Preferences: {
          name: "Preferences",
          description:
            "Sets your preferences for the instance refresh so that it performs as expected when you start it.",
          type: {
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
                  type: "number",
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
                    type: "array",
                    items: {
                      type: "string",
                    },
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

        const command = new StartInstanceRefreshCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Instance Refresh Result",
      description: "Result from StartInstanceRefresh operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceRefreshId: {
            type: "string",
            description:
              "A unique ID for tracking the progress of the instance refresh.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startInstanceRefresh;

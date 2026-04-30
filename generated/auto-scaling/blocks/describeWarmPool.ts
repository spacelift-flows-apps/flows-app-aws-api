import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  DescribeWarmPoolCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeWarmPool: AppBlock = {
  name: "Describe Warm Pool",
  description: `Gets information about a warm pool and its instances.`,
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
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of instances to return with this call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of instances to return.",
          type: "string",
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

        const command = new DescribeWarmPoolCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Warm Pool Result",
      description: "Result from DescribeWarmPool operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          WarmPoolConfiguration: {
            type: "object",
            properties: {
              MaxGroupPreparedCapacity: {
                type: "number",
              },
              MinSize: {
                type: "number",
              },
              PoolState: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              InstanceReusePolicy: {
                type: "object",
                properties: {
                  ReuseOnScaleIn: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "The warm pool configuration details.",
          },
          Instances: {
            type: "array",
            items: {
              type: "object",
              properties: {
                InstanceId: {
                  type: "string",
                },
                InstanceType: {
                  type: "string",
                },
                AvailabilityZone: {
                  type: "string",
                },
                AvailabilityZoneId: {
                  type: "string",
                },
                LifecycleState: {
                  type: "string",
                },
                HealthStatus: {
                  type: "string",
                },
                LaunchConfigurationName: {
                  type: "string",
                },
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
                ImageId: {
                  type: "string",
                },
                ProtectedFromScaleIn: {
                  type: "boolean",
                },
                WeightedCapacity: {
                  type: "string",
                },
              },
              required: [
                "InstanceId",
                "AvailabilityZone",
                "LifecycleState",
                "HealthStatus",
                "ProtectedFromScaleIn",
              ],
              additionalProperties: false,
            },
            description: "The instances that are currently in the warm pool.",
          },
          NextToken: {
            type: "string",
            description:
              "This string indicates that the response contains more items than can be returned in a single response.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeWarmPool;

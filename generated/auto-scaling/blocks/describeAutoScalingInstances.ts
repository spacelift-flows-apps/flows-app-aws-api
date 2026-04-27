import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  DescribeAutoScalingInstancesCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAutoScalingInstances: AppBlock = {
  name: "Describe Auto Scaling Instances",
  description: `Gets information about the Auto Scaling instances in the account and Region.`,
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
        InstanceIds: {
          name: "Instance Ids",
          description: "The IDs of the instances.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description: "The maximum number of items to return with this call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
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

        const command = new DescribeAutoScalingInstancesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Auto Scaling Instances Result",
      description: "Result from DescribeAutoScalingInstances operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AutoScalingInstances: {
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
                AutoScalingGroupName: {
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
                "AutoScalingGroupName",
                "AvailabilityZone",
                "LifecycleState",
                "HealthStatus",
                "ProtectedFromScaleIn",
              ],
              additionalProperties: false,
            },
            description: "The instances.",
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

export default describeAutoScalingInstances;

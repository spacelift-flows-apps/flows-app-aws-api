import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  LaunchInstancesCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const launchInstances: AppBlock = {
  name: "Launch Instances",
  description: `Launches a specified number of instances in an Auto Scaling group.`,
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
          description:
            "The name of the Auto Scaling group to launch instances into.",
          type: "string",
          required: true,
        },
        RequestedCapacity: {
          name: "Requested Capacity",
          description: "The number of instances to launch.",
          type: "number",
          required: true,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "A unique, case-sensitive identifier to ensure idempotency of the request.",
          type: "string",
          required: true,
        },
        AvailabilityZones: {
          name: "Availability Zones",
          description: "The Availability Zones for the instance launch.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AvailabilityZoneIds: {
          name: "Availability Zone Ids",
          description:
            "A list of Availability Zone IDs where instances should be launched.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        SubnetIds: {
          name: "Subnet Ids",
          description: "The subnet IDs for the instance launch.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        RetryStrategy: {
          name: "Retry Strategy",
          description:
            "Specifies whether to retry asynchronously if the synchronous launch fails.",
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

        const command = new LaunchInstancesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Launch Instances Result",
      description: "Result from LaunchInstances operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AutoScalingGroupName: {
            type: "string",
            description:
              "The name of the Auto Scaling group where the instances were launched.",
          },
          ClientToken: {
            type: "string",
            description:
              "The idempotency token used for the request, either customer-specified or auto-generated.",
          },
          Instances: {
            type: "array",
            items: {
              type: "object",
              properties: {
                InstanceType: {
                  type: "string",
                },
                MarketType: {
                  type: "string",
                },
                SubnetId: {
                  type: "string",
                },
                AvailabilityZone: {
                  type: "string",
                },
                AvailabilityZoneId: {
                  type: "string",
                },
                InstanceIds: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of successfully launched instances including details such as instance type, Availability Zone, subnet, lifecycle state, and instance IDs.",
          },
          Errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                InstanceType: {
                  type: "string",
                },
                MarketType: {
                  type: "string",
                },
                SubnetId: {
                  type: "string",
                },
                AvailabilityZone: {
                  type: "string",
                },
                AvailabilityZoneId: {
                  type: "string",
                },
                ErrorCode: {
                  type: "string",
                },
                ErrorMessage: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of errors encountered during the launch attempt including details about failed instance launches with their corresponding error codes and messages.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default launchInstances;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ApplicationAutoScalingClient,
  DescribeScheduledActionsCommand,
} from "@aws-sdk/client-application-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeScheduledActions: AppBlock = {
  name: "Describe Scheduled Actions",
  description: `Describes the Application Auto Scaling scheduled actions for the specified service namespace.`,
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
        ScheduledActionNames: {
          name: "Scheduled Action Names",
          description: "The names of the scheduled actions to describe.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ServiceNamespace: {
          name: "Service Namespace",
          description:
            "The namespace of the Amazon Web Services service that provides the resource.",
          type: "string",
          required: true,
        },
        ResourceId: {
          name: "Resource Id",
          description:
            "The identifier of the resource associated with the scheduled action.",
          type: "string",
          required: false,
        },
        ScalableDimension: {
          name: "Scalable Dimension",
          description: "The scalable dimension.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of scheduled action results.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of results.",
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

        const client = new ApplicationAutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeScheduledActionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Scheduled Actions Result",
      description: "Result from DescribeScheduledActions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ScheduledActions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ScheduledActionName: {
                  type: "string",
                },
                ScheduledActionARN: {
                  type: "string",
                },
                ServiceNamespace: {
                  type: "string",
                },
                Schedule: {
                  type: "string",
                },
                Timezone: {
                  type: "string",
                },
                ResourceId: {
                  type: "string",
                },
                ScalableDimension: {
                  type: "string",
                },
                StartTime: {
                  type: "string",
                },
                EndTime: {
                  type: "string",
                },
                ScalableTargetAction: {
                  type: "object",
                  properties: {
                    MinCapacity: {
                      type: "number",
                    },
                    MaxCapacity: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                CreationTime: {
                  type: "string",
                },
              },
              required: [
                "ScheduledActionName",
                "ScheduledActionARN",
                "ServiceNamespace",
                "Schedule",
                "ResourceId",
                "CreationTime",
              ],
              additionalProperties: false,
            },
            description: "Information about the scheduled actions.",
          },
          NextToken: {
            type: "string",
            description: "The token required to get the next set of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeScheduledActions;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
} from "@aws-sdk/client-application-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeScalableTargets: AppBlock = {
  name: "Describe Scalable Targets",
  description: `Gets information about the scalable targets in the specified namespace.`,
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
        ServiceNamespace: {
          name: "Service Namespace",
          description:
            "The namespace of the Amazon Web Services service that provides the resource.",
          type: "string",
          required: true,
        },
        ResourceIds: {
          name: "Resource Ids",
          description:
            "The identifier of the resource associated with the scalable target.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ScalableDimension: {
          name: "Scalable Dimension",
          description:
            "The scalable dimension associated with the scalable target.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of scalable targets.",
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

        const command = new DescribeScalableTargetsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Scalable Targets Result",
      description: "Result from DescribeScalableTargets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ScalableTargets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ServiceNamespace: {
                  type: "string",
                },
                ResourceId: {
                  type: "string",
                },
                ScalableDimension: {
                  type: "string",
                },
                MinCapacity: {
                  type: "number",
                },
                MaxCapacity: {
                  type: "number",
                },
                PredictedCapacity: {
                  type: "number",
                },
                RoleARN: {
                  type: "string",
                },
                CreationTime: {
                  type: "string",
                },
                SuspendedState: {
                  type: "object",
                  properties: {
                    DynamicScalingInSuspended: {
                      type: "boolean",
                    },
                    DynamicScalingOutSuspended: {
                      type: "boolean",
                    },
                    ScheduledScalingSuspended: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
                ScalableTargetARN: {
                  type: "string",
                },
              },
              required: [
                "ServiceNamespace",
                "ResourceId",
                "ScalableDimension",
                "MinCapacity",
                "MaxCapacity",
                "RoleARN",
                "CreationTime",
              ],
              additionalProperties: false,
            },
            description:
              "The scalable targets that match the request parameters.",
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

export default describeScalableTargets;

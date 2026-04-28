import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  DescribeScalingActivitiesCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeScalingActivities: AppBlock = {
  name: "Describe Scaling Activities",
  description: `Gets information about the scaling activities in the account and Region.`,
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
        ActivityIds: {
          name: "Activity Ids",
          description: "The activity IDs of the desired scaling activities.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AutoScalingGroupName: {
          name: "Auto Scaling Group Name",
          description: "The name of the Auto Scaling group.",
          type: "string",
          required: false,
        },
        IncludeDeletedGroups: {
          name: "Include Deleted Groups",
          description:
            "Indicates whether to include scaling activity from deleted Auto Scaling groups.",
          type: "boolean",
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
        Filters: {
          name: "Filters",
          description:
            "One or more filters to limit the results based on specific criteria.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
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

        const command = new DescribeScalingActivitiesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Scaling Activities Result",
      description: "Result from DescribeScalingActivities operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Activities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ActivityId: {
                  type: "string",
                },
                AutoScalingGroupName: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                Cause: {
                  type: "string",
                },
                StartTime: {
                  type: "string",
                },
                EndTime: {
                  type: "string",
                },
                StatusCode: {
                  type: "string",
                },
                StatusMessage: {
                  type: "string",
                },
                Progress: {
                  type: "number",
                },
                Details: {
                  type: "string",
                },
                AutoScalingGroupState: {
                  type: "string",
                },
                AutoScalingGroupARN: {
                  type: "string",
                },
              },
              required: [
                "ActivityId",
                "AutoScalingGroupName",
                "Cause",
                "StartTime",
                "StatusCode",
              ],
              additionalProperties: false,
            },
            description: "The scaling activities.",
          },
          NextToken: {
            type: "string",
            description:
              "A string that indicates that the response contains more items than can be returned in a single response.",
          },
        },
        required: ["Activities"],
      },
    },
  },
};

export default describeScalingActivities;

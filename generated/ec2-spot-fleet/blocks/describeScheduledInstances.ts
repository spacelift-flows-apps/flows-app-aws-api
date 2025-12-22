import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeScheduledInstancesCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeScheduledInstances: AppBlock = {
  name: "Describe Scheduled Instances",
  description: `Describes the specified Scheduled Instances or all your Scheduled Instances.`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "The filters.",
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
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to return in a single call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of results.",
          type: "string",
          required: false,
        },
        ScheduledInstanceIds: {
          name: "Scheduled Instance Ids",
          description: "The Scheduled Instance IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        SlotStartTimeRange: {
          name: "Slot Start Time Range",
          description: "The time period for the first schedule to start.",
          type: {
            type: "object",
            properties: {
              EarliestTime: {
                type: "string",
              },
              LatestTime: {
                type: "string",
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
            credentials: {
              accessKeyId: input.app.config.accessKeyId,
              secretAccessKey: input.app.config.secretAccessKey,
              sessionToken: input.app.config.sessionToken,
            },
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeScheduledInstancesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Scheduled Instances Result",
      description: "Result from DescribeScheduledInstances operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The token required to retrieve the next set of results.",
          },
          ScheduledInstanceSet: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AvailabilityZone: {
                  type: "string",
                },
                CreateDate: {
                  type: "string",
                },
                HourlyPrice: {
                  type: "string",
                },
                InstanceCount: {
                  type: "number",
                },
                InstanceType: {
                  type: "string",
                },
                NetworkPlatform: {
                  type: "string",
                },
                NextSlotStartTime: {
                  type: "string",
                },
                Platform: {
                  type: "string",
                },
                PreviousSlotEndTime: {
                  type: "string",
                },
                Recurrence: {
                  type: "object",
                  properties: {
                    Frequency: {
                      type: "string",
                    },
                    Interval: {
                      type: "number",
                    },
                    OccurrenceDaySet: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    OccurrenceRelativeToEnd: {
                      type: "boolean",
                    },
                    OccurrenceUnit: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                ScheduledInstanceId: {
                  type: "string",
                },
                SlotDurationInHours: {
                  type: "number",
                },
                TermEndDate: {
                  type: "string",
                },
                TermStartDate: {
                  type: "string",
                },
                TotalScheduledInstanceHours: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the Scheduled Instances.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeScheduledInstances;

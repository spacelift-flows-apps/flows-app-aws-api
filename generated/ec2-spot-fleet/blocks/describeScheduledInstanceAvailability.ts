import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeScheduledInstanceAvailabilityCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeScheduledInstanceAvailability: AppBlock = {
  name: "Describe Scheduled Instance Availability",
  description: `Finds available schedules that meet the specified criteria.`,
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
        FirstSlotStartTimeRange: {
          name: "First Slot Start Time Range",
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
            required: ["EarliestTime", "LatestTime"],
            additionalProperties: false,
          },
          required: true,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to return in a single call.",
          type: "number",
          required: false,
        },
        MaxSlotDurationInHours: {
          name: "Max Slot Duration In Hours",
          description: "The maximum available duration, in hours.",
          type: "number",
          required: false,
        },
        MinSlotDurationInHours: {
          name: "Min Slot Duration In Hours",
          description: "The minimum available duration, in hours.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of results.",
          type: "string",
          required: false,
        },
        Recurrence: {
          name: "Recurrence",
          description: "The schedule recurrence.",
          type: {
            type: "object",
            properties: {
              Frequency: {
                type: "string",
              },
              Interval: {
                type: "number",
              },
              OccurrenceDays: {
                type: "array",
                items: {
                  type: "number",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeScheduledInstanceAvailabilityCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Scheduled Instance Availability Result",
      description:
        "Result from DescribeScheduledInstanceAvailability operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The token required to retrieve the next set of results.",
          },
          ScheduledInstanceAvailabilitySet: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AvailabilityZone: {
                  type: "string",
                },
                AvailableInstanceCount: {
                  type: "number",
                },
                FirstSlotStartTime: {
                  type: "string",
                },
                HourlyPrice: {
                  type: "string",
                },
                InstanceType: {
                  type: "string",
                },
                MaxTermDurationInDays: {
                  type: "number",
                },
                MinTermDurationInDays: {
                  type: "number",
                },
                NetworkPlatform: {
                  type: "string",
                },
                Platform: {
                  type: "string",
                },
                PurchaseToken: {
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
                SlotDurationInHours: {
                  type: "number",
                },
                TotalScheduledInstanceHours: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the available Scheduled Instances.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeScheduledInstanceAvailability;

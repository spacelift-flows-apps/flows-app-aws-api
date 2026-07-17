import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  ListInsightsDataCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const listInsightsData: AppBlock = {
  name: "List Insights Data",
  description: `Returns Insights events generated on a trail that logs data events.`,
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
        InsightSource: {
          name: "Insight Source",
          description:
            "The Amazon Resource Name(ARN) of the trail for which you want to retrieve Insights events.",
          type: "string",
          required: true,
        },
        DataType: {
          name: "Data Type",
          description: "Specifies the category of events returned.",
          type: {
            type: "string",
            enum: ["InsightsEvents"],
          },
          required: true,
        },
        Dimensions: {
          name: "Dimensions",
          description: "Contains a map of dimensions.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        StartTime: {
          name: "Start Time",
          description:
            "Specifies that only events that occur after or at the specified time are returned.",
          type: "string",
          required: false,
        },
        EndTime: {
          name: "End Time",
          description:
            "Specifies that only events that occur before or at the specified time are returned.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The number of events to return.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The token to use to get the next page of results after a previous API call.",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListInsightsDataCommand(
          convertTimestamps(
            commandInput,
            new Set(["StartTime", "EndTime"]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Insights Data Result",
      description: "Result from ListInsightsData operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                EventId: {
                  type: "string",
                },
                EventName: {
                  type: "string",
                },
                ReadOnly: {
                  type: "string",
                },
                AccessKeyId: {
                  type: "string",
                },
                EventTime: {
                  type: "string",
                },
                EventSource: {
                  type: "string",
                },
                Username: {
                  type: "string",
                },
                Resources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ResourceType: {
                        type: "string",
                      },
                      ResourceName: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                CloudTrailEvent: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of events returned based on the InsightSource, DataType or Dimensions specified.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to use to get the next page of results after a previous API call.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listInsightsData;

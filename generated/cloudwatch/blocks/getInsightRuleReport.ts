import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  GetInsightRuleReportCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getInsightRuleReport: AppBlock = {
  name: "Get Insight Rule Report",
  description: `This operation returns the time series data collected by a Contributor Insights rule.`,
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
        RuleName: {
          name: "Rule Name",
          description: "The name of the rule that you want to see data from.",
          type: "string",
          required: true,
        },
        StartTime: {
          name: "Start Time",
          description: "The start time of the data to use in the report.",
          type: "string",
          required: true,
        },
        EndTime: {
          name: "End Time",
          description: "The end time of the data to use in the report.",
          type: "string",
          required: true,
        },
        Period: {
          name: "Period",
          description:
            "The period, in seconds, to use for the statistics in the InsightRuleMetricDatapoint results.",
          type: "number",
          required: true,
        },
        MaxContributorCount: {
          name: "Max Contributor Count",
          description:
            "The maximum number of contributors to include in the report.",
          type: "number",
          required: false,
        },
        Metrics: {
          name: "Metrics",
          description:
            "Specifies which metrics to use for aggregation of contributor values for the report.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        OrderBy: {
          name: "Order By",
          description:
            "Determines what statistic to use to rank the contributors.",
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

        const client = new CloudWatchClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetInsightRuleReportCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Insight Rule Report Result",
      description: "Result from GetInsightRuleReport operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          KeyLabels: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "An array of the strings used as the keys for this rule.",
          },
          AggregationStatistic: {
            type: "string",
            description:
              "Specifies whether this rule aggregates contributor data by COUNT or SUM.",
          },
          AggregateValue: {
            type: "number",
            description:
              "The sum of the values from all individual contributors that match the rule.",
          },
          ApproximateUniqueCount: {
            type: "number",
            description:
              "An approximate count of the unique contributors found by this rule in this time period.",
          },
          Contributors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Keys: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                ApproximateAggregateValue: {
                  type: "number",
                },
                Datapoints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Timestamp: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ApproximateValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Timestamp", "ApproximateValue"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["Keys", "ApproximateAggregateValue", "Datapoints"],
              additionalProperties: false,
            },
            description:
              "An array of the unique contributors found by this rule in this time period.",
          },
          MetricDatapoints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Timestamp: {
                  type: "string",
                },
                UniqueContributors: {
                  type: "number",
                },
                MaxContributorValue: {
                  type: "number",
                },
                SampleCount: {
                  type: "number",
                },
                Average: {
                  type: "number",
                },
                Sum: {
                  type: "number",
                },
                Minimum: {
                  type: "number",
                },
                Maximum: {
                  type: "number",
                },
              },
              required: ["Timestamp"],
              additionalProperties: false,
            },
            description:
              "A time series of metric data points that matches the time period in the rule request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getInsightRuleReport;

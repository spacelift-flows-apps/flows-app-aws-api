import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  DescribeMetricFiltersCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeMetricFilters: AppBlock = {
  name: "Describe Metric Filters",
  description: `Lists the specified metric filters.`,
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
        logGroupName: {
          name: "log Group Name",
          description: "The name of the log group.",
          type: "string",
          required: false,
        },
        filterNamePrefix: {
          name: "filter Name Prefix",
          description: "The prefix to match.",
          type: "string",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        limit: {
          name: "limit",
          description: "The maximum number of items returned.",
          type: "number",
          required: false,
        },
        metricName: {
          name: "metric Name",
          description:
            "Filters results to include only those with the specified metric name.",
          type: "string",
          required: false,
        },
        metricNamespace: {
          name: "metric Namespace",
          description:
            "Filters results to include only those in the specified namespace.",
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeMetricFiltersCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Metric Filters Result",
      description: "Result from DescribeMetricFilters operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          metricFilters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                filterName: {
                  type: "string",
                },
                filterPattern: {
                  type: "string",
                },
                metricTransformations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      metricName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      metricNamespace: {
                        type: "object",
                        additionalProperties: true,
                      },
                      metricValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      defaultValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      dimensions: {
                        type: "object",
                        additionalProperties: true,
                      },
                      unit: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["metricName", "metricNamespace", "metricValue"],
                    additionalProperties: false,
                  },
                },
                creationTime: {
                  type: "number",
                },
                logGroupName: {
                  type: "string",
                },
                applyOnTransformedLogs: {
                  type: "boolean",
                },
                fieldSelectionCriteria: {
                  type: "string",
                },
                emitSystemFieldDimensions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description: "The metric filters.",
          },
          nextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeMetricFilters;

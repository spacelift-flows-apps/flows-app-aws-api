import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getMetricStatistics: AppBlock = {
  name: "Get Metric Statistics",
  description: `Gets statistics for the specified metric.`,
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
        Namespace: {
          name: "Namespace",
          description: "The namespace of the metric, with or without spaces.",
          type: "string",
          required: true,
        },
        MetricName: {
          name: "Metric Name",
          description: "The name of the metric, with or without spaces.",
          type: "string",
          required: true,
        },
        Dimensions: {
          name: "Dimensions",
          description: "The dimensions.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              required: ["Name", "Value"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        StartTime: {
          name: "Start Time",
          description:
            "The time stamp that determines the first data point to return.",
          type: "string",
          required: true,
        },
        EndTime: {
          name: "End Time",
          description:
            "The time stamp that determines the last data point to return.",
          type: "string",
          required: true,
        },
        Period: {
          name: "Period",
          description:
            "The granularity, in seconds, of the returned data points.",
          type: "number",
          required: true,
        },
        Statistics: {
          name: "Statistics",
          description: "The metric statistics, other than percentile.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ExtendedStatistics: {
          name: "Extended Statistics",
          description: "The percentile statistics.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Unit: {
          name: "Unit",
          description: "The unit for a given metric.",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new CloudWatchClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetMetricStatisticsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Metric Statistics Result",
      description: "Result from GetMetricStatistics operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Label: {
            type: "string",
            description: "A label for the specified metric.",
          },
          Datapoints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Timestamp: {
                  type: "string",
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
                Unit: {
                  type: "string",
                },
                ExtendedStatistics: {
                  type: "object",
                  additionalProperties: {
                    type: "number",
                  },
                },
              },
              additionalProperties: false,
            },
            description: "The data points for the specified metric.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getMetricStatistics;

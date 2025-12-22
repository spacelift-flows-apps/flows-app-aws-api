import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  PutMetricStreamCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putMetricStream: AppBlock = {
  name: "Put Metric Stream",
  description: `Creates or updates a metric stream.`,
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
        Name: {
          name: "Name",
          description:
            "If you are creating a new metric stream, this is the name for the new stream.",
          type: "string",
          required: true,
        },
        IncludeFilters: {
          name: "Include Filters",
          description:
            "If you specify this parameter, the stream sends only the metrics from the metric namespaces that you specify here.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Namespace: {
                  type: "string",
                },
                MetricNames: {
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
        ExcludeFilters: {
          name: "Exclude Filters",
          description:
            "If you specify this parameter, the stream sends metrics from all metric namespaces except for the namespaces that you specify here.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Namespace: {
                  type: "string",
                },
                MetricNames: {
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
        FirehoseArn: {
          name: "Firehose Arn",
          description:
            "The ARN of the Amazon Kinesis Data Firehose delivery stream to use for this metric stream.",
          type: "string",
          required: true,
        },
        RoleArn: {
          name: "Role Arn",
          description:
            "The ARN of an IAM role that this metric stream will use to access Amazon Kinesis Data Firehose resources.",
          type: "string",
          required: true,
        },
        OutputFormat: {
          name: "Output Format",
          description: "The output format for the stream.",
          type: "string",
          required: true,
        },
        Tags: {
          name: "Tags",
          description:
            "A list of key-value pairs to associate with the metric stream.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              required: ["Key", "Value"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        StatisticsConfigurations: {
          name: "Statistics Configurations",
          description:
            "By default, a metric stream always sends the MAX, MIN, SUM, and SAMPLECOUNT statistics for each metric that is streamed.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                IncludeMetrics: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Namespace: {
                        type: "object",
                        additionalProperties: true,
                      },
                      MetricName: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Namespace", "MetricName"],
                    additionalProperties: false,
                  },
                },
                AdditionalStatistics: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["IncludeMetrics", "AdditionalStatistics"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        IncludeLinkedAccountsMetrics: {
          name: "Include Linked Accounts Metrics",
          description:
            "If you are creating a metric stream in a monitoring account, specify true to include metrics from source accounts in the metric stream.",
          type: "boolean",
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

        const command = new PutMetricStreamCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Metric Stream Result",
      description: "Result from PutMetricStream operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Arn: {
            type: "string",
            description: "The ARN of the metric stream.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putMetricStream;

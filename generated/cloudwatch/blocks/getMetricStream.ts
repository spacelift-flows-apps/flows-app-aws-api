import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  GetMetricStreamCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getMetricStream: AppBlock = {
  name: "Get Metric Stream",
  description: `Returns information about the metric stream that you specify.`,
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
            "The name of the metric stream to retrieve information about.",
          type: "string",
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

        const client = new CloudWatchClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetMetricStreamCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Metric Stream Result",
      description: "Result from GetMetricStream operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Arn: {
            type: "string",
            description: "The ARN of the metric stream.",
          },
          Name: {
            type: "string",
            description: "The name of the metric stream.",
          },
          IncludeFilters: {
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
            description:
              "If this array of metric namespaces is present, then these namespaces are the only metric namespaces that are streamed by this metric stream.",
          },
          ExcludeFilters: {
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
            description:
              "If this array of metric namespaces is present, then these namespaces are the only metric namespaces that are not streamed by this metric stream.",
          },
          FirehoseArn: {
            type: "string",
            description:
              "The ARN of the Amazon Kinesis Data Firehose delivery stream that is used by this metric stream.",
          },
          RoleArn: {
            type: "string",
            description:
              "The ARN of the IAM role that is used by this metric stream.",
          },
          State: {
            type: "string",
            description: "The state of the metric stream.",
          },
          CreationDate: {
            type: "string",
            description: "The date that the metric stream was created.",
          },
          LastUpdateDate: {
            type: "string",
            description:
              "The date of the most recent update to the metric stream's configuration.",
          },
          OutputFormat: {
            type: "string",
            description: "The output format for the stream.",
          },
          StatisticsConfigurations: {
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
            description:
              "Each entry in this array displays information about one or more metrics that include additional statistics in the metric stream.",
          },
          IncludeLinkedAccountsMetrics: {
            type: "boolean",
            description:
              "If this is true and this metric stream is in a monitoring account, then the stream includes metrics from source accounts that the monitoring account is linked to.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getMetricStream;

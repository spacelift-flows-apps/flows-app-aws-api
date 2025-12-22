import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  GetMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getMetricData: AppBlock = {
  name: "Get Metric Data",
  description: `You can use the GetMetricData API to retrieve CloudWatch metric values.`,
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
        MetricDataQueries: {
          name: "Metric Data Queries",
          description: "The metric queries to be returned.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                MetricStat: {
                  type: "object",
                  properties: {
                    Metric: {
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
                        Dimensions: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    Period: {
                      type: "number",
                    },
                    Stat: {
                      type: "string",
                    },
                    Unit: {
                      type: "string",
                    },
                  },
                  required: ["Metric", "Period", "Stat"],
                  additionalProperties: false,
                },
                Expression: {
                  type: "string",
                },
                Label: {
                  type: "string",
                },
                ReturnData: {
                  type: "boolean",
                },
                Period: {
                  type: "number",
                },
                AccountId: {
                  type: "string",
                },
              },
              required: ["Id"],
              additionalProperties: false,
            },
          },
          required: true,
        },
        StartTime: {
          name: "Start Time",
          description:
            "The time stamp indicating the earliest data to be returned.",
          type: "string",
          required: true,
        },
        EndTime: {
          name: "End Time",
          description:
            "The time stamp indicating the latest data to be returned.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description:
            "Include this value, if it was returned by the previous GetMetricData operation, to get the next set of data points.",
          type: "string",
          required: false,
        },
        ScanBy: {
          name: "Scan By",
          description: "The order in which data points should be returned.",
          type: "string",
          required: false,
        },
        MaxDatapoints: {
          name: "Max Datapoints",
          description:
            "The maximum number of data points the request should return before paginating.",
          type: "number",
          required: false,
        },
        LabelOptions: {
          name: "Label Options",
          description:
            "This structure includes the Timezone parameter, which you can use to specify your time zone so that the labels of returned data display the correct time for your time zone.",
          type: {
            type: "object",
            properties: {
              Timezone: {
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

        const command = new GetMetricDataCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Metric Data Result",
      description: "Result from GetMetricData operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          MetricDataResults: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                Label: {
                  type: "string",
                },
                Timestamps: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                Values: {
                  type: "array",
                  items: {
                    type: "number",
                  },
                },
                StatusCode: {
                  type: "string",
                },
                Messages: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Code: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "The metrics that are returned, including the metric name, namespace, and dimensions.",
          },
          NextToken: {
            type: "string",
            description:
              "A token that marks the next batch of returned results.",
          },
          Messages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Code: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Contains a message about this GetMetricData operation, if the operation results in such a message.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getMetricData;

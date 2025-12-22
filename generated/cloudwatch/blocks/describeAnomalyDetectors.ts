import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  DescribeAnomalyDetectorsCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAnomalyDetectors: AppBlock = {
  name: "Describe Anomaly Detectors",
  description: `Lists the anomaly detection models that you have created in your account.`,
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
        NextToken: {
          name: "Next Token",
          description:
            "Use the token returned by the previous operation to request the next page of results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to return in one operation.",
          type: "number",
          required: false,
        },
        Namespace: {
          name: "Namespace",
          description:
            "Limits the results to only the anomaly detection models that are associated with the specified namespace.",
          type: "string",
          required: false,
        },
        MetricName: {
          name: "Metric Name",
          description:
            "Limits the results to only the anomaly detection models that are associated with the specified metric name.",
          type: "string",
          required: false,
        },
        Dimensions: {
          name: "Dimensions",
          description:
            "Limits the results to only the anomaly detection models that are associated with the specified metric dimensions.",
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
        AnomalyDetectorTypes: {
          name: "Anomaly Detector Types",
          description:
            "The anomaly detector types to request when using DescribeAnomalyDetectorsInput.",
          type: {
            type: "array",
            items: {
              type: "string",
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

        const client = new CloudWatchClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeAnomalyDetectorsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Anomaly Detectors Result",
      description: "Result from DescribeAnomalyDetectors operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AnomalyDetectors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Namespace: {
                  type: "string",
                },
                MetricName: {
                  type: "string",
                },
                Dimensions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Name", "Value"],
                    additionalProperties: false,
                  },
                },
                Stat: {
                  type: "string",
                },
                Configuration: {
                  type: "object",
                  properties: {
                    ExcludedTimeRanges: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    MetricTimezone: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                StateValue: {
                  type: "string",
                },
                MetricCharacteristics: {
                  type: "object",
                  properties: {
                    PeriodicSpikes: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
                SingleMetricAnomalyDetector: {
                  type: "object",
                  properties: {
                    AccountId: {
                      type: "string",
                    },
                    Namespace: {
                      type: "string",
                    },
                    MetricName: {
                      type: "string",
                    },
                    Dimensions: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Stat: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                MetricMathAnomalyDetector: {
                  type: "object",
                  properties: {
                    MetricDataQueries: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description:
              "The list of anomaly detection models returned by the operation.",
          },
          NextToken: {
            type: "string",
            description:
              "A token that you can use in a subsequent operation to retrieve the next set of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeAnomalyDetectors;

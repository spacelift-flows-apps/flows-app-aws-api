import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  PutAnomalyDetectorCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putAnomalyDetector: AppBlock = {
  name: "Put Anomaly Detector",
  description: `Creates an anomaly detection model for a CloudWatch metric.`,
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
          description:
            "The namespace of the metric to create the anomaly detection model for.",
          type: "string",
          required: false,
        },
        MetricName: {
          name: "Metric Name",
          description:
            "The name of the metric to create the anomaly detection model for.",
          type: "string",
          required: false,
        },
        Dimensions: {
          name: "Dimensions",
          description:
            "The metric dimensions to create the anomaly detection model for.",
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
        Stat: {
          name: "Stat",
          description:
            "The statistic to use for the metric and the anomaly detection model.",
          type: "string",
          required: false,
        },
        Configuration: {
          name: "Configuration",
          description:
            "The configuration specifies details about how the anomaly detection model is to be trained, including time ranges to exclude when training and updating the model.",
          type: {
            type: "object",
            properties: {
              ExcludedTimeRanges: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    StartTime: {
                      type: "string",
                    },
                    EndTime: {
                      type: "string",
                    },
                  },
                  required: ["StartTime", "EndTime"],
                  additionalProperties: false,
                },
              },
              MetricTimezone: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        MetricCharacteristics: {
          name: "Metric Characteristics",
          description:
            "Use this object to include parameters to provide information about your metric to CloudWatch to help it build more accurate anomaly detection models.",
          type: {
            type: "object",
            properties: {
              PeriodicSpikes: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        SingleMetricAnomalyDetector: {
          name: "Single Metric Anomaly Detector",
          description: "A single metric anomaly detector to be created.",
          type: {
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
              Stat: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        MetricMathAnomalyDetector: {
          name: "Metric Math Anomaly Detector",
          description: "The metric math anomaly detector to be created.",
          type: {
            type: "object",
            properties: {
              MetricDataQueries: {
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
                          additionalProperties: true,
                        },
                        Period: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Stat: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Unit: {
                          type: "object",
                          additionalProperties: true,
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

        const client = new CloudWatchClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutAnomalyDetectorCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Anomaly Detector Result",
      description: "Result from PutAnomalyDetector operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default putAnomalyDetector;

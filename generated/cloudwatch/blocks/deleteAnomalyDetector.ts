import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  DeleteAnomalyDetectorCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteAnomalyDetector: AppBlock = {
  name: "Delete Anomaly Detector",
  description: `Deletes the specified anomaly detection model from your account.`,
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
            "The namespace associated with the anomaly detection model to delete.",
          type: "string",
          required: false,
        },
        MetricName: {
          name: "Metric Name",
          description:
            "The metric name associated with the anomaly detection model to delete.",
          type: "string",
          required: false,
        },
        Dimensions: {
          name: "Dimensions",
          description:
            "The metric dimensions associated with the anomaly detection model to delete.",
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
            "The statistic associated with the anomaly detection model to delete.",
          type: "string",
          required: false,
        },
        SingleMetricAnomalyDetector: {
          name: "Single Metric Anomaly Detector",
          description: "A single metric anomaly detector to be deleted.",
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
          description: "The metric math anomaly detector to be deleted.",
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

        const command = new DeleteAnomalyDetectorCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Anomaly Detector Result",
      description: "Result from DeleteAnomalyDetector operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default deleteAnomalyDetector;

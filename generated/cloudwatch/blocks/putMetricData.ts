import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putMetricData: AppBlock = {
  name: "Put Metric Data",
  description: `Publishes metric data to Amazon CloudWatch.`,
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
          description: "The namespace for the metric data.",
          type: "string",
          required: true,
        },
        MetricData: {
          name: "Metric Data",
          description: "The data for the metrics.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
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
                Timestamp: {
                  type: "string",
                },
                Value: {
                  type: "number",
                },
                StatisticValues: {
                  type: "object",
                  properties: {
                    SampleCount: {
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
                  required: ["SampleCount", "Sum", "Minimum", "Maximum"],
                  additionalProperties: false,
                },
                Values: {
                  type: "array",
                  items: {
                    type: "number",
                  },
                },
                Counts: {
                  type: "array",
                  items: {
                    type: "number",
                  },
                },
                Unit: {
                  type: "string",
                },
                StorageResolution: {
                  type: "number",
                },
              },
              required: ["MetricName"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        EntityMetricData: {
          name: "Entity Metric Data",
          description:
            "Data for metrics that contain associated entity information.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Entity: {
                  type: "object",
                  properties: {
                    KeyAttributes: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                    Attributes: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                  },
                  additionalProperties: false,
                },
                MetricData: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      MetricName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Dimensions: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Timestamp: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                      StatisticValues: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Values: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Counts: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Unit: {
                        type: "object",
                        additionalProperties: true,
                      },
                      StorageResolution: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["MetricName"],
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        StrictEntityValidation: {
          name: "Strict Entity Validation",
          description:
            "Whether to accept valid metric data when an invalid entity is sent.",
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

        const command = new PutMetricDataCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Metric Data Result",
      description: "Result from PutMetricData operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default putMetricData;

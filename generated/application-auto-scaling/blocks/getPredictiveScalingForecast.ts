import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ApplicationAutoScalingClient,
  GetPredictiveScalingForecastCommand,
} from "@aws-sdk/client-application-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const getPredictiveScalingForecast: AppBlock = {
  name: "Get Predictive Scaling Forecast",
  description: `Retrieves the forecast data for a predictive scaling policy.`,
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
        ServiceNamespace: {
          name: "Service Namespace",
          description:
            "The namespace of the Amazon Web Services service that provides the resource.",
          type: "string",
          required: true,
        },
        ResourceId: {
          name: "Resource Id",
          description: "The identifier of the resource.",
          type: "string",
          required: true,
        },
        ScalableDimension: {
          name: "Scalable Dimension",
          description: "The scalable dimension.",
          type: "string",
          required: true,
        },
        PolicyName: {
          name: "Policy Name",
          description: "The name of the policy.",
          type: "string",
          required: true,
        },
        StartTime: {
          name: "Start Time",
          description:
            "The inclusive start time of the time range for the forecast data to get.",
          type: "string",
          required: true,
        },
        EndTime: {
          name: "End Time",
          description:
            "The exclusive end time of the time range for the forecast data to get.",
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

        const client = new ApplicationAutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetPredictiveScalingForecastCommand(
          convertTimestamps(
            commandInput,
            new Set(["StartTime", "EndTime"]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Predictive Scaling Forecast Result",
      description: "Result from GetPredictiveScalingForecast operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          LoadForecast: {
            type: "array",
            items: {
              type: "object",
              properties: {
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
                MetricSpecification: {
                  type: "object",
                  properties: {
                    TargetValue: {
                      type: "number",
                    },
                    PredefinedMetricPairSpecification: {
                      type: "object",
                      properties: {
                        PredefinedMetricType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ResourceLabel: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["PredefinedMetricType"],
                      additionalProperties: false,
                    },
                    PredefinedScalingMetricSpecification: {
                      type: "object",
                      properties: {
                        PredefinedMetricType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ResourceLabel: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["PredefinedMetricType"],
                      additionalProperties: false,
                    },
                    PredefinedLoadMetricSpecification: {
                      type: "object",
                      properties: {
                        PredefinedMetricType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ResourceLabel: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["PredefinedMetricType"],
                      additionalProperties: false,
                    },
                    CustomizedScalingMetricSpecification: {
                      type: "object",
                      properties: {
                        MetricDataQueries: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["MetricDataQueries"],
                      additionalProperties: false,
                    },
                    CustomizedLoadMetricSpecification: {
                      type: "object",
                      properties: {
                        MetricDataQueries: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["MetricDataQueries"],
                      additionalProperties: false,
                    },
                    CustomizedCapacityMetricSpecification: {
                      type: "object",
                      properties: {
                        MetricDataQueries: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["MetricDataQueries"],
                      additionalProperties: false,
                    },
                  },
                  required: ["TargetValue"],
                  additionalProperties: false,
                },
              },
              required: ["Timestamps", "Values", "MetricSpecification"],
              additionalProperties: false,
            },
            description: "The load forecast.",
          },
          CapacityForecast: {
            type: "object",
            properties: {
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
            },
            required: ["Timestamps", "Values"],
            additionalProperties: false,
            description: "The capacity forecast.",
          },
          UpdateTime: {
            type: "string",
            description: "The time the forecast was made.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getPredictiveScalingForecast;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  ListAnomaliesCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listAnomalies: AppBlock = {
  name: "List Anomalies",
  description: `Returns a list of anomalies that log anomaly detectors have found.`,
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
        anomalyDetectorArn: {
          name: "anomaly Detector Arn",
          description:
            "Use this to optionally limit the results to only the anomalies found by a certain anomaly detector.",
          type: "string",
          required: false,
        },
        suppressionState: {
          name: "suppression State",
          description:
            "You can specify this parameter if you want to the operation to return only anomalies that are currently either suppressed or unsuppressed.",
          type: "string",
          required: false,
        },
        limit: {
          name: "limit",
          description: "The maximum number of items to return.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
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

        const command = new ListAnomaliesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Anomalies Result",
      description: "Result from ListAnomalies operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          anomalies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                anomalyId: {
                  type: "string",
                },
                patternId: {
                  type: "string",
                },
                anomalyDetectorArn: {
                  type: "string",
                },
                patternString: {
                  type: "string",
                },
                patternRegex: {
                  type: "string",
                },
                priority: {
                  type: "string",
                },
                firstSeen: {
                  type: "number",
                },
                lastSeen: {
                  type: "number",
                },
                description: {
                  type: "string",
                },
                active: {
                  type: "boolean",
                },
                state: {
                  type: "string",
                },
                histogram: {
                  type: "object",
                  additionalProperties: {
                    type: "number",
                  },
                },
                logSamples: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      timestamp: {
                        type: "object",
                        additionalProperties: true,
                      },
                      message: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                patternTokens: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      dynamicTokenPosition: {
                        type: "object",
                        additionalProperties: true,
                      },
                      isDynamic: {
                        type: "object",
                        additionalProperties: true,
                      },
                      tokenString: {
                        type: "object",
                        additionalProperties: true,
                      },
                      enumerations: {
                        type: "object",
                        additionalProperties: true,
                      },
                      inferredTokenName: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                logGroupArnList: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                suppressed: {
                  type: "boolean",
                },
                suppressedDate: {
                  type: "number",
                },
                suppressedUntil: {
                  type: "number",
                },
                isPatternLevelSuppression: {
                  type: "boolean",
                },
              },
              required: [
                "anomalyId",
                "patternId",
                "anomalyDetectorArn",
                "patternString",
                "firstSeen",
                "lastSeen",
                "description",
                "active",
                "state",
                "histogram",
                "logSamples",
                "patternTokens",
                "logGroupArnList",
              ],
              additionalProperties: false,
            },
            description:
              "An array of structures, where each structure contains information about one anomaly that a log anomaly detector has found.",
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

export default listAnomalies;

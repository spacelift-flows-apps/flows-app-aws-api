import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  ListLogAnomalyDetectorsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listLogAnomalyDetectors: AppBlock = {
  name: "List Log Anomaly Detectors",
  description: `Retrieves a list of the log anomaly detectors in the account.`,
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
        filterLogGroupArn: {
          name: "filter Log Group Arn",
          description:
            "Use this to optionally filter the results to only include anomaly detectors that are associated with the specified log group.",
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

        const command = new ListLogAnomalyDetectorsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Log Anomaly Detectors Result",
      description: "Result from ListLogAnomalyDetectors operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          anomalyDetectors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                anomalyDetectorArn: {
                  type: "string",
                },
                detectorName: {
                  type: "string",
                },
                logGroupArnList: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                evaluationFrequency: {
                  type: "string",
                },
                filterPattern: {
                  type: "string",
                },
                anomalyDetectorStatus: {
                  type: "string",
                },
                kmsKeyId: {
                  type: "string",
                },
                creationTimeStamp: {
                  type: "number",
                },
                lastModifiedTimeStamp: {
                  type: "number",
                },
                anomalyVisibilityTime: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description:
              "An array of structures, where each structure in the array contains information about one anomaly detector.",
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

export default listLogAnomalyDetectors;

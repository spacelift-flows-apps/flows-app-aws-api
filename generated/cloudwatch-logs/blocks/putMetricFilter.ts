import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  PutMetricFilterCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putMetricFilter: AppBlock = {
  name: "Put Metric Filter",
  description: `Creates or updates a metric filter and associates it with the specified log group.`,
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
        logGroupName: {
          name: "log Group Name",
          description: "The name of the log group.",
          type: "string",
          required: true,
        },
        filterName: {
          name: "filter Name",
          description: "A name for the metric filter.",
          type: "string",
          required: true,
        },
        filterPattern: {
          name: "filter Pattern",
          description:
            "A filter pattern for extracting metric data out of ingested log events.",
          type: "string",
          required: true,
        },
        metricTransformations: {
          name: "metric Transformations",
          description:
            "A collection of information that defines how metric data gets emitted.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                metricName: {
                  type: "string",
                },
                metricNamespace: {
                  type: "string",
                },
                metricValue: {
                  type: "string",
                },
                defaultValue: {
                  type: "number",
                },
                dimensions: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
                unit: {
                  type: "string",
                },
              },
              required: ["metricName", "metricNamespace", "metricValue"],
              additionalProperties: false,
            },
          },
          required: true,
        },
        applyOnTransformedLogs: {
          name: "apply On Transformed Logs",
          description:
            "This parameter is valid only for log groups that have an active log transformer.",
          type: "boolean",
          required: false,
        },
        fieldSelectionCriteria: {
          name: "field Selection Criteria",
          description:
            "A filter expression that specifies which log events should be processed by this metric filter based on system fields such as source account and source region.",
          type: "string",
          required: false,
        },
        emitSystemFieldDimensions: {
          name: "emit System Field Dimensions",
          description:
            "A list of system fields to emit as additional dimensions in the generated metrics.",
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutMetricFilterCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Metric Filter Result",
      description: "Result from PutMetricFilter operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default putMetricFilter;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  UpdateLogAnomalyDetectorCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateLogAnomalyDetector: AppBlock = {
  name: "Update Log Anomaly Detector",
  description: `Updates an existing log anomaly detector.`,
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
            "The ARN of the anomaly detector that you want to update.",
          type: "string",
          required: true,
        },
        evaluationFrequency: {
          name: "evaluation Frequency",
          description:
            "Specifies how often the anomaly detector runs and look for anomalies.",
          type: "string",
          required: false,
        },
        filterPattern: {
          name: "filter Pattern",
          description:
            "A symbolic description of how CloudWatch Logs should interpret the data in each log event.",
          type: "string",
          required: false,
        },
        anomalyVisibilityTime: {
          name: "anomaly Visibility Time",
          description:
            "The number of days to use as the life cycle of anomalies.",
          type: "number",
          required: false,
        },
        enabled: {
          name: "enabled",
          description:
            "Use this parameter to pause or restart the anomaly detector.",
          type: "boolean",
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateLogAnomalyDetectorCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Log Anomaly Detector Result",
      description: "Result from UpdateLogAnomalyDetector operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default updateLogAnomalyDetector;

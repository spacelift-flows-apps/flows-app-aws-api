import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  CreateLogAnomalyDetectorCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createLogAnomalyDetector: AppBlock = {
  name: "Create Log Anomaly Detector",
  description: `Creates an anomaly detector that regularly scans one or more log groups and look for patterns and anomalies in the logs.`,
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
        logGroupArnList: {
          name: "log Group Arn List",
          description:
            "An array containing the ARN of the log group that this anomaly detector will watch.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        detectorName: {
          name: "detector Name",
          description: "A name for this anomaly detector.",
          type: "string",
          required: false,
        },
        evaluationFrequency: {
          name: "evaluation Frequency",
          description:
            "Specifies how often the anomaly detector is to run and look for anomalies.",
          type: "string",
          required: false,
        },
        filterPattern: {
          name: "filter Pattern",
          description:
            "You can use this parameter to limit the anomaly detection model to examine only log events that match the pattern you specify here.",
          type: "string",
          required: false,
        },
        kmsKeyId: {
          name: "kms Key Id",
          description:
            "Optionally assigns a KMS key to secure this anomaly detector and its findings.",
          type: "string",
          required: false,
        },
        anomalyVisibilityTime: {
          name: "anomaly Visibility Time",
          description: "The number of days to have visibility on an anomaly.",
          type: "number",
          required: false,
        },
        tags: {
          name: "tags",
          description:
            "An optional list of key-value pairs to associate with the resource.",
          type: {
            type: "object",
            additionalProperties: {
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

        const command = new CreateLogAnomalyDetectorCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Log Anomaly Detector Result",
      description: "Result from CreateLogAnomalyDetector operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          anomalyDetectorArn: {
            type: "string",
            description:
              "The ARN of the log anomaly detector that you just created.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createLogAnomalyDetector;

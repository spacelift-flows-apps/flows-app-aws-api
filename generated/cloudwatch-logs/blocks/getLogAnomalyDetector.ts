import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  GetLogAnomalyDetectorCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getLogAnomalyDetector: AppBlock = {
  name: "Get Log Anomaly Detector",
  description: `Retrieves information about the log anomaly detector that you specify.`,
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
            "The ARN of the anomaly detector to retrieve information about.",
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetLogAnomalyDetectorCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Log Anomaly Detector Result",
      description: "Result from GetLogAnomalyDetector operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          detectorName: {
            type: "string",
            description: "The name of the log anomaly detector",
          },
          logGroupArnList: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "An array of structures, where each structure contains the ARN of a log group associated with this anomaly detector.",
          },
          evaluationFrequency: {
            type: "string",
            description:
              "Specifies how often the anomaly detector runs and look for anomalies.",
          },
          filterPattern: {
            type: "string",
            description:
              "A symbolic description of how CloudWatch Logs should interpret the data in each log event.",
          },
          anomalyDetectorStatus: {
            type: "string",
            description:
              "Specifies whether the anomaly detector is currently active.",
          },
          kmsKeyId: {
            type: "string",
            description:
              "The ARN of the KMS key assigned to this anomaly detector, if any.",
          },
          creationTimeStamp: {
            type: "number",
            description:
              "The date and time when this anomaly detector was created.",
          },
          lastModifiedTimeStamp: {
            type: "number",
            description:
              "The date and time when this anomaly detector was most recently modified.",
          },
          anomalyVisibilityTime: {
            type: "number",
            description:
              "The number of days used as the life cycle of anomalies.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getLogAnomalyDetector;

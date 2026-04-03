import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  UpdateAnomalyCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateAnomaly: AppBlock = {
  name: "Update Anomaly",
  description: `Use this operation to suppress anomaly detection for a specified anomaly or pattern.`,
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
        anomalyId: {
          name: "anomaly Id",
          description:
            "If you are suppressing or unsuppressing an anomaly, specify its unique ID here.",
          type: "string",
          required: false,
        },
        patternId: {
          name: "pattern Id",
          description:
            "If you are suppressing or unsuppressing an pattern, specify its unique ID here.",
          type: "string",
          required: false,
        },
        anomalyDetectorArn: {
          name: "anomaly Detector Arn",
          description:
            "The ARN of the anomaly detector that this operation is to act on.",
          type: "string",
          required: true,
        },
        suppressionType: {
          name: "suppression Type",
          description:
            "Use this to specify whether the suppression to be temporary or infinite.",
          type: "string",
          required: false,
        },
        suppressionPeriod: {
          name: "suppression Period",
          description:
            "If you are temporarily suppressing an anomaly or pattern, use this structure to specify how long the suppression is to last.",
          type: {
            type: "object",
            properties: {
              value: {
                type: "number",
              },
              suppressionUnit: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        baseline: {
          name: "baseline",
          description:
            "Set this to true to prevent CloudWatch Logs from displaying this behavior as an anomaly in the future.",
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

        const command = new UpdateAnomalyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Anomaly Result",
      description: "Result from UpdateAnomaly operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default updateAnomaly;

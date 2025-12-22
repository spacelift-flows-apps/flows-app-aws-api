import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  GetTrailStatusCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getTrailStatus: AppBlock = {
  name: "Get Trail Status",
  description: `Returns a JSON-formatted list of information about the specified trail.`,
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
        Name: {
          name: "Name",
          description:
            "Specifies the name or the CloudTrail ARN of the trail for which you are requesting status.",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetTrailStatusCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Trail Status Result",
      description: "Result from GetTrailStatus operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          IsLogging: {
            type: "boolean",
            description:
              "Whether the CloudTrail trail is currently logging Amazon Web Services API calls.",
          },
          LatestDeliveryError: {
            type: "string",
            description:
              "Displays any Amazon S3 error that CloudTrail encountered when attempting to deliver log files to the designated bucket.",
          },
          LatestNotificationError: {
            type: "string",
            description:
              "Displays any Amazon SNS error that CloudTrail encountered when attempting to send a notification.",
          },
          LatestDeliveryTime: {
            type: "string",
            description:
              "Specifies the date and time that CloudTrail last delivered log files to an account's Amazon S3 bucket.",
          },
          LatestNotificationTime: {
            type: "string",
            description:
              "Specifies the date and time of the most recent Amazon SNS notification that CloudTrail has written a new log file to an account's Amazon S3 bucket.",
          },
          StartLoggingTime: {
            type: "string",
            description:
              "Specifies the most recent date and time when CloudTrail started recording API calls for an Amazon Web Services account.",
          },
          StopLoggingTime: {
            type: "string",
            description:
              "Specifies the most recent date and time when CloudTrail stopped recording API calls for an Amazon Web Services account.",
          },
          LatestCloudWatchLogsDeliveryError: {
            type: "string",
            description:
              "Displays any CloudWatch Logs error that CloudTrail encountered when attempting to deliver logs to CloudWatch Logs.",
          },
          LatestCloudWatchLogsDeliveryTime: {
            type: "string",
            description:
              "Displays the most recent date and time when CloudTrail delivered logs to CloudWatch Logs.",
          },
          LatestDigestDeliveryTime: {
            type: "string",
            description:
              "Specifies the date and time that CloudTrail last delivered a digest file to an account's Amazon S3 bucket.",
          },
          LatestDigestDeliveryError: {
            type: "string",
            description:
              "Displays any Amazon S3 error that CloudTrail encountered when attempting to deliver a digest file to the designated bucket.",
          },
          LatestDeliveryAttemptTime: {
            type: "string",
            description: "This field is no longer in use.",
          },
          LatestNotificationAttemptTime: {
            type: "string",
            description: "This field is no longer in use.",
          },
          LatestNotificationAttemptSucceeded: {
            type: "string",
            description: "This field is no longer in use.",
          },
          LatestDeliveryAttemptSucceeded: {
            type: "string",
            description: "This field is no longer in use.",
          },
          TimeLoggingStarted: {
            type: "string",
            description: "This field is no longer in use.",
          },
          TimeLoggingStopped: {
            type: "string",
            description: "This field is no longer in use.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getTrailStatus;

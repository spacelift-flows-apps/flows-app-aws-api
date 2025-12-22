import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  UpdateTrailCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateTrail: AppBlock = {
  name: "Update Trail",
  description: `Updates trail settings that control what events you are logging, and how to handle log files.`,
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
          description: "Specifies the name of the trail or trail ARN.",
          type: "string",
          required: true,
        },
        S3BucketName: {
          name: "S3Bucket Name",
          description:
            "Specifies the name of the Amazon S3 bucket designated for publishing log files.",
          type: "string",
          required: false,
        },
        S3KeyPrefix: {
          name: "S3Key Prefix",
          description:
            "Specifies the Amazon S3 key prefix that comes after the name of the bucket you have designated for log file delivery.",
          type: "string",
          required: false,
        },
        SnsTopicName: {
          name: "Sns Topic Name",
          description:
            "Specifies the name or ARN of the Amazon SNS topic defined for notification of log file delivery.",
          type: "string",
          required: false,
        },
        IncludeGlobalServiceEvents: {
          name: "Include Global Service Events",
          description:
            "Specifies whether the trail is publishing events from global services such as IAM to the log files.",
          type: "boolean",
          required: false,
        },
        IsMultiRegionTrail: {
          name: "Is Multi Region Trail",
          description:
            "Specifies whether the trail applies only to the current Region or to all Regions.",
          type: "boolean",
          required: false,
        },
        EnableLogFileValidation: {
          name: "Enable Log File Validation",
          description: "Specifies whether log file validation is enabled.",
          type: "boolean",
          required: false,
        },
        CloudWatchLogsLogGroupArn: {
          name: "Cloud Watch Logs Log Group Arn",
          description:
            "Specifies a log group name using an Amazon Resource Name (ARN), a unique identifier that represents the log group to which CloudTrail logs are delivered.",
          type: "string",
          required: false,
        },
        CloudWatchLogsRoleArn: {
          name: "Cloud Watch Logs Role Arn",
          description:
            "Specifies the role for the CloudWatch Logs endpoint to assume to write to a user's log group.",
          type: "string",
          required: false,
        },
        KmsKeyId: {
          name: "Kms Key Id",
          description:
            "Specifies the KMS key ID to use to encrypt the logs delivered by CloudTrail.",
          type: "string",
          required: false,
        },
        IsOrganizationTrail: {
          name: "Is Organization Trail",
          description:
            "Specifies whether the trail is applied to all accounts in an organization in Organizations, or only for the current Amazon Web Services account.",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateTrailCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Trail Result",
      description: "Result from UpdateTrail operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Name: {
            type: "string",
            description: "Specifies the name of the trail.",
          },
          S3BucketName: {
            type: "string",
            description:
              "Specifies the name of the Amazon S3 bucket designated for publishing log files.",
          },
          S3KeyPrefix: {
            type: "string",
            description:
              "Specifies the Amazon S3 key prefix that comes after the name of the bucket you have designated for log file delivery.",
          },
          SnsTopicName: {
            type: "string",
            description: "This field is no longer in use.",
          },
          SnsTopicARN: {
            type: "string",
            description:
              "Specifies the ARN of the Amazon SNS topic that CloudTrail uses to send notifications when log files are delivered.",
          },
          IncludeGlobalServiceEvents: {
            type: "boolean",
            description:
              "Specifies whether the trail is publishing events from global services such as IAM to the log files.",
          },
          IsMultiRegionTrail: {
            type: "boolean",
            description:
              "Specifies whether the trail exists in one Region or in all Regions.",
          },
          TrailARN: {
            type: "string",
            description: "Specifies the ARN of the trail that was updated.",
          },
          LogFileValidationEnabled: {
            type: "boolean",
            description:
              "Specifies whether log file integrity validation is enabled.",
          },
          CloudWatchLogsLogGroupArn: {
            type: "string",
            description:
              "Specifies the Amazon Resource Name (ARN) of the log group to which CloudTrail logs are delivered.",
          },
          CloudWatchLogsRoleArn: {
            type: "string",
            description:
              "Specifies the role for the CloudWatch Logs endpoint to assume to write to a user's log group.",
          },
          KmsKeyId: {
            type: "string",
            description:
              "Specifies the KMS key ID that encrypts the logs delivered by CloudTrail.",
          },
          IsOrganizationTrail: {
            type: "boolean",
            description:
              "Specifies whether the trail is an organization trail.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateTrail;

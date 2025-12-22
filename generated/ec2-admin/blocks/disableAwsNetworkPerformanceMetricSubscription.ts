import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DisableAwsNetworkPerformanceMetricSubscriptionCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const disableAwsNetworkPerformanceMetricSubscription: AppBlock = {
  name: "Disable Aws Network Performance Metric Subscription",
  description: `Disables Infrastructure Performance metric subscriptions.`,
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
        Source: {
          name: "Source",
          description:
            "The source Region or Availability Zone that the metric subscription is disabled for.",
          type: "string",
          required: false,
        },
        Destination: {
          name: "Destination",
          description:
            "The target Region or Availability Zone that the metric subscription is disabled for.",
          type: "string",
          required: false,
        },
        Metric: {
          name: "Metric",
          description: "The metric used for the disabled subscription.",
          type: "string",
          required: false,
        },
        Statistic: {
          name: "Statistic",
          description: "The statistic used for the disabled subscription.",
          type: "string",
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command =
          new DisableAwsNetworkPerformanceMetricSubscriptionCommand(
            commandInput as any,
          );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Disable Aws Network Performance Metric Subscription Result",
      description:
        "Result from DisableAwsNetworkPerformanceMetricSubscription operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Output: {
            type: "boolean",
            description:
              "Indicates whether the unsubscribe action was successful.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default disableAwsNetworkPerformanceMetricSubscription;

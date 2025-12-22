import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  EnableAwsNetworkPerformanceMetricSubscriptionCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const enableAwsNetworkPerformanceMetricSubscription: AppBlock = {
  name: "Enable Aws Network Performance Metric Subscription",
  description: `Enables Infrastructure Performance subscriptions.`,
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
            "The source Region (like us-east-1) or Availability Zone ID (like use1-az1) that the metric subscription is enabled for.",
          type: "string",
          required: false,
        },
        Destination: {
          name: "Destination",
          description:
            "The target Region (like us-east-2) or Availability Zone ID (like use2-az2) that the metric subscription is enabled for.",
          type: "string",
          required: false,
        },
        Metric: {
          name: "Metric",
          description: "The metric used for the enabled subscription.",
          type: "string",
          required: false,
        },
        Statistic: {
          name: "Statistic",
          description: "The statistic used for the enabled subscription.",
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
          new EnableAwsNetworkPerformanceMetricSubscriptionCommand(
            commandInput as any,
          );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Enable Aws Network Performance Metric Subscription Result",
      description:
        "Result from EnableAwsNetworkPerformanceMetricSubscription operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Output: {
            type: "boolean",
            description:
              "Indicates whether the subscribe action was successful.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default enableAwsNetworkPerformanceMetricSubscription;

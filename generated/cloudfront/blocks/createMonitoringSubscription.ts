import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  CreateMonitoringSubscriptionCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createMonitoringSubscription: AppBlock = {
  name: "Create Monitoring Subscription",
  description: `Enables or disables additional Amazon CloudWatch metrics for the specified CloudFront distribution.`,
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
        DistributionId: {
          name: "Distribution Id",
          description:
            "The ID of the distribution that you are enabling metrics for.",
          type: "string",
          required: true,
        },
        MonitoringSubscription: {
          name: "Monitoring Subscription",
          description: "A monitoring subscription.",
          type: {
            type: "object",
            properties: {
              RealtimeMetricsSubscriptionConfig: {
                type: "object",
                properties: {
                  RealtimeMetricsSubscriptionStatus: {
                    type: "string",
                  },
                },
                required: ["RealtimeMetricsSubscriptionStatus"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateMonitoringSubscriptionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Monitoring Subscription Result",
      description: "Result from CreateMonitoringSubscription operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          MonitoringSubscription: {
            type: "object",
            properties: {
              RealtimeMetricsSubscriptionConfig: {
                type: "object",
                properties: {
                  RealtimeMetricsSubscriptionStatus: {
                    type: "string",
                  },
                },
                required: ["RealtimeMetricsSubscriptionStatus"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "A monitoring subscription.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createMonitoringSubscription;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  TestMetricFilterCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const testMetricFilter: AppBlock = {
  name: "Test Metric Filter",
  description: `Tests the filter pattern of a metric filter against a sample of log event messages.`,
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
        filterPattern: {
          name: "filter Pattern",
          description:
            "A symbolic description of how CloudWatch Logs should interpret the data in each log event.",
          type: "string",
          required: true,
        },
        logEventMessages: {
          name: "log Event Messages",
          description: "The log event messages to test.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new TestMetricFilterCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Test Metric Filter Result",
      description: "Result from TestMetricFilter operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                eventNumber: {
                  type: "number",
                },
                eventMessage: {
                  type: "string",
                },
                extractedValues: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description: "The matched events.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default testMetricFilter;

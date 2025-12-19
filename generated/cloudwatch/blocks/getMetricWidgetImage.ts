import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  GetMetricWidgetImageCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getMetricWidgetImage: AppBlock = {
  name: "Get Metric Widget Image",
  description: `You can use the GetMetricWidgetImage API to retrieve a snapshot graph of one or more Amazon CloudWatch metrics as a bitmap image.`,
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
        MetricWidget: {
          name: "Metric Widget",
          description:
            "A JSON string that defines the bitmap graph to be retrieved.",
          type: "string",
          required: true,
        },
        OutputFormat: {
          name: "Output Format",
          description: "The format of the resulting image.",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new CloudWatchClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetMetricWidgetImageCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Metric Widget Image Result",
      description: "Result from GetMetricWidgetImage operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          MetricWidgetImage: {
            type: "string",
            description:
              "The image of the graph, in the output format specified.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getMetricWidgetImage;

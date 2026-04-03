import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  PutSubscriptionFilterCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putSubscriptionFilter: AppBlock = {
  name: "Put Subscription Filter",
  description: `Creates or updates a subscription filter and associates it with the specified log group.`,
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
        logGroupName: {
          name: "log Group Name",
          description: "The name of the log group.",
          type: "string",
          required: true,
        },
        filterName: {
          name: "filter Name",
          description: "A name for the subscription filter.",
          type: "string",
          required: true,
        },
        filterPattern: {
          name: "filter Pattern",
          description:
            "A filter pattern for subscribing to a filtered stream of log events.",
          type: "string",
          required: true,
        },
        destinationArn: {
          name: "destination Arn",
          description:
            "The ARN of the destination to deliver matching log events to.",
          type: "string",
          required: true,
        },
        roleArn: {
          name: "role Arn",
          description:
            "The ARN of an IAM role that grants CloudWatch Logs permissions to deliver ingested log events to the destination stream.",
          type: "string",
          required: false,
        },
        distribution: {
          name: "distribution",
          description:
            "The method used to distribute log data to the destination.",
          type: "string",
          required: false,
        },
        applyOnTransformedLogs: {
          name: "apply On Transformed Logs",
          description:
            "This parameter is valid only for log groups that have an active log transformer.",
          type: "boolean",
          required: false,
        },
        fieldSelectionCriteria: {
          name: "field Selection Criteria",
          description:
            "A filter expression that specifies which log events should be processed by this subscription filter based on system fields such as source account and source region.",
          type: "string",
          required: false,
        },
        emitSystemFields: {
          name: "emit System Fields",
          description:
            "A list of system fields to include in the log events sent to the subscription destination.",
          type: {
            type: "array",
            items: {
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

        const command = new PutSubscriptionFilterCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Subscription Filter Result",
      description: "Result from PutSubscriptionFilter operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default putSubscriptionFilter;

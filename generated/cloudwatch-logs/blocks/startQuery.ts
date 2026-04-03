import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  StartQueryCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startQuery: AppBlock = {
  name: "Start Query",
  description: `Starts a query of one or more log groups or data sources using CloudWatch Logs Insights.`,
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
        queryLanguage: {
          name: "query Language",
          description: "Specify the query language to use for this query.",
          type: "string",
          required: false,
        },
        logGroupName: {
          name: "log Group Name",
          description: "The log group on which to perform the query.",
          type: "string",
          required: false,
        },
        logGroupNames: {
          name: "log Group Names",
          description: "The list of log groups to be queried.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        logGroupIdentifiers: {
          name: "log Group Identifiers",
          description: "The list of log groups to query.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        startTime: {
          name: "start Time",
          description: "The beginning of the time range to query.",
          type: "number",
          required: true,
        },
        endTime: {
          name: "end Time",
          description: "The end of the time range to query.",
          type: "number",
          required: true,
        },
        queryString: {
          name: "query String",
          description: "The query string to use.",
          type: "string",
          required: true,
        },
        limit: {
          name: "limit",
          description:
            "The maximum number of log events to return in the query.",
          type: "number",
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

        const command = new StartQueryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Query Result",
      description: "Result from StartQuery operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          queryId: {
            type: "string",
            description: "The unique ID of the query.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startQuery;

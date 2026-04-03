import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  DescribeQueriesCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeQueries: AppBlock = {
  name: "Describe Queries",
  description: `Returns a list of CloudWatch Logs Insights queries that are scheduled, running, or have been run recently in this account.`,
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
          description:
            "Limits the returned queries to only those for the specified log group.",
          type: "string",
          required: false,
        },
        status: {
          name: "status",
          description:
            "Limits the returned queries to only those that have the specified status.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "Limits the number of returned queries to the specified number.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        queryLanguage: {
          name: "query Language",
          description:
            "Limits the returned queries to only the queries that use the specified query language.",
          type: "string",
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

        const command = new DescribeQueriesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Queries Result",
      description: "Result from DescribeQueries operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          queries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                queryLanguage: {
                  type: "string",
                },
                queryId: {
                  type: "string",
                },
                queryString: {
                  type: "string",
                },
                status: {
                  type: "string",
                },
                createTime: {
                  type: "number",
                },
                logGroupName: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The list of queries that match the request.",
          },
          nextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeQueries;

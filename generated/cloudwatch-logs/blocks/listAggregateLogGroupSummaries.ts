import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  ListAggregateLogGroupSummariesCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listAggregateLogGroupSummaries: AppBlock = {
  name: "List Aggregate Log Group Summaries",
  description: `Returns an aggregate summary of all log groups in the Region grouped by specified data source characteristics.`,
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
        accountIdentifiers: {
          name: "account Identifiers",
          description:
            "When includeLinkedAccounts is set to true, use this parameter to specify the list of accounts to search.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        includeLinkedAccounts: {
          name: "include Linked Accounts",
          description:
            "If you are using a monitoring account, set this to true to have the operation return log groups in the accounts listed in accountIdentifiers.",
          type: "boolean",
          required: false,
        },
        logGroupClass: {
          name: "log Group Class",
          description:
            "Filters the results by log group class to include only log groups of the specified class.",
          type: "string",
          required: false,
        },
        logGroupNamePattern: {
          name: "log Group Name Pattern",
          description:
            "Use this parameter to limit the returned log groups to only those with names that match the pattern that you specify.",
          type: "string",
          required: false,
        },
        dataSources: {
          name: "data Sources",
          description:
            "Filters the results by data source characteristics to include only log groups associated with the specified data sources.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                type: {
                  type: "string",
                },
              },
              required: ["name"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        groupBy: {
          name: "group By",
          description: "Specifies how to group the log groups in the summary.",
          type: "string",
          required: true,
        },
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        limit: {
          name: "limit",
          description: "The maximum number of aggregated summaries to return.",
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

        const command = new ListAggregateLogGroupSummariesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Aggregate Log Group Summaries Result",
      description: "Result from ListAggregateLogGroupSummaries operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          aggregateLogGroupSummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                logGroupCount: {
                  type: "number",
                },
                groupingIdentifiers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "The list of aggregate log group summaries grouped by the specified data source characteristics.",
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

export default listAggregateLogGroupSummaries;

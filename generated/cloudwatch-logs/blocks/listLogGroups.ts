import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  ListLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listLogGroups: AppBlock = {
  name: "List Log Groups",
  description: `Returns a list of log groups in the Region in your account.`,
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
        logGroupNamePattern: {
          name: "log Group Name Pattern",
          description:
            "Use this parameter to limit the returned log groups to only those with names that match the pattern that you specify.",
          type: "string",
          required: false,
        },
        logGroupClass: {
          name: "log Group Class",
          description:
            "Use this parameter to limit the results to only those log groups in the specified log group class.",
          type: "string",
          required: false,
        },
        includeLinkedAccounts: {
          name: "include Linked Accounts",
          description:
            "If you are using a monitoring account, set this to true to have the operation return log groups in the accounts listed in accountIdentifiers.",
          type: "boolean",
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
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        limit: {
          name: "limit",
          description: "The maximum number of log groups to return.",
          type: "number",
          required: false,
        },
        dataSources: {
          name: "data Sources",
          description:
            "An array of data source filters to filter log groups by their associated data sources.",
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
        fieldIndexNames: {
          name: "field Index Names",
          description:
            "An array of field index names to filter log groups that have specific field indexes.",
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

        const command = new ListLogGroupsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Log Groups Result",
      description: "Result from ListLogGroups operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          logGroups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                logGroupName: {
                  type: "string",
                },
                logGroupArn: {
                  type: "string",
                },
                logGroupClass: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "An array of structures, where each structure contains the information about one log group.",
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

export default listLogGroups;

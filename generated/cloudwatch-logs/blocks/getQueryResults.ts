import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  GetQueryResultsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getQueryResults: AppBlock = {
  name: "Get Query Results",
  description: `Returns the results from the specified query.`,
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
        queryId: {
          name: "query Id",
          description: "The ID number of the query.",
          type: "string",
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

        const command = new GetQueryResultsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Query Results Result",
      description: "Result from GetQueryResults operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          queryLanguage: {
            type: "string",
            description: "The query language used for this query.",
          },
          results: {
            type: "array",
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                  },
                  value: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            description:
              "The log events that matched the query criteria during the most recent time it ran.",
          },
          statistics: {
            type: "object",
            properties: {
              recordsMatched: {
                type: "number",
              },
              recordsScanned: {
                type: "number",
              },
              estimatedRecordsSkipped: {
                type: "number",
              },
              bytesScanned: {
                type: "number",
              },
              estimatedBytesSkipped: {
                type: "number",
              },
              logGroupsScanned: {
                type: "number",
              },
            },
            additionalProperties: false,
            description:
              "Includes the number of log events scanned by the query, the number of log events that matched the query criteria, and the total number of bytes in the scanned log events.",
          },
          status: {
            type: "string",
            description: "The status of the most recent running of the query.",
          },
          encryptionKey: {
            type: "string",
            description:
              "If you associated an KMS key with the CloudWatch Logs Insights query results in this account, this field displays the ARN of the key that's used to encrypt the query results when StartQuery stores them.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getQueryResults;

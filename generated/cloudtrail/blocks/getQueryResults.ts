import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  GetQueryResultsCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getQueryResults: AppBlock = {
  name: "Get Query Results",
  description: `Gets event data results of a query.`,
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
        EventDataStore: {
          name: "Event Data Store",
          description:
            "The ARN (or ID suffix of the ARN) of the event data store against which the query was run.",
          type: "string",
          required: false,
        },
        QueryId: {
          name: "Query Id",
          description: "The ID of the query for which you want to get results.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description:
            "A token you can use to get the next page of query results.",
          type: "string",
          required: false,
        },
        MaxQueryResults: {
          name: "Max Query Results",
          description:
            "The maximum number of query results to display on a single page.",
          type: "number",
          required: false,
        },
        EventDataStoreOwnerAccountId: {
          name: "Event Data Store Owner Account Id",
          description: "The account ID of the event data store owner.",
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

        const client = new CloudTrailClient({
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
          QueryStatus: {
            type: "string",
            description: "The status of the query.",
          },
          QueryStatistics: {
            type: "object",
            properties: {
              ResultsCount: {
                type: "number",
              },
              TotalResultsCount: {
                type: "number",
              },
              BytesScanned: {
                type: "number",
              },
            },
            additionalProperties: false,
            description: "Shows the count of query results.",
          },
          QueryResultRows: {
            type: "array",
            items: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
            },
            description: "Contains the individual event results of the query.",
          },
          NextToken: {
            type: "string",
            description:
              "A token you can use to get the next page of query results.",
          },
          ErrorMessage: {
            type: "string",
            description: "The error message returned if a query failed.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getQueryResults;

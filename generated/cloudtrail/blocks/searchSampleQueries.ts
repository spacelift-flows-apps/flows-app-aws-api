import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  SearchSampleQueriesCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const searchSampleQueries: AppBlock = {
  name: "Search Sample Queries",
  description: `Searches sample queries and returns a list of sample queries that are sorted by relevance.`,
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
        SearchPhrase: {
          name: "Search Phrase",
          description:
            "The natural language phrase to use for the semantic search.",
          type: "string",
          required: true,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to return on a single page.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "A token you can use to get the next page of results.",
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

        const command = new SearchSampleQueriesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Search Sample Queries Result",
      description: "Result from SearchSampleQueries operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SearchResults: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                SQL: {
                  type: "string",
                },
                Relevance: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of objects containing the search results ordered from most relevant to least relevant.",
          },
          NextToken: {
            type: "string",
            description: "A token you can use to get the next page of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default searchSampleQueries;

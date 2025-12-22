import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  ListQueriesCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listQueries: AppBlock = {
  name: "List Queries",
  description: `Returns a list of queries and query statuses for the past seven days.`,
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
            "The ARN (or the ID suffix of the ARN) of an event data store on which queries were run.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description: "A token you can use to get the next page of results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of queries to show on a page.",
          type: "number",
          required: false,
        },
        StartTime: {
          name: "Start Time",
          description:
            "Use with EndTime to bound a ListQueries request, and limit its results to only those queries run within a specified time period.",
          type: "string",
          required: false,
        },
        EndTime: {
          name: "End Time",
          description:
            "Use with StartTime to bound a ListQueries request, and limit its results to only those queries run within a specified time period.",
          type: "string",
          required: false,
        },
        QueryStatus: {
          name: "Query Status",
          description:
            "The status of queries that you want to return in results.",
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
        }

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListQueriesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Queries Result",
      description: "Result from ListQueries operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Queries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                QueryId: {
                  type: "string",
                },
                QueryStatus: {
                  type: "string",
                },
                CreationTime: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Lists matching query results, and shows query ID, status, and creation time of each query.",
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

export default listQueries;

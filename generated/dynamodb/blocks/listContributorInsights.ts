import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  ListContributorInsightsCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listContributorInsights: AppBlock = {
  name: "List Contributor Insights",
  description: `Returns a list of ContributorInsightsSummary for a table and all its global secondary indexes.`,
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
        TableName: {
          name: "Table Name",
          description: "The name of the table.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "A token to for the desired page, if there is one.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "Maximum number of results to return per page.",
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

        const client = new DynamoDBClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListContributorInsightsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Contributor Insights Result",
      description: "Result from ListContributorInsights operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ContributorInsightsSummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                TableName: {
                  type: "string",
                },
                IndexName: {
                  type: "string",
                },
                ContributorInsightsStatus: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of ContributorInsightsSummary.",
          },
          NextToken: {
            type: "string",
            description: "A token to go to the next page if there is one.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listContributorInsights;

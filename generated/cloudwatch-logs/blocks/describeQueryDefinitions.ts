import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  DescribeQueryDefinitionsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeQueryDefinitions: AppBlock = {
  name: "Describe Query Definitions",
  description: `This operation returns a paginated list of your saved CloudWatch Logs Insights query definitions.`,
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
          description: "The query language used for this query.",
          type: "string",
          required: false,
        },
        queryDefinitionNamePrefix: {
          name: "query Definition Name Prefix",
          description:
            "Use this parameter to filter your results to only the query definitions that have names that start with the prefix you specify.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "Limits the number of returned query definitions to the specified number.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
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

        const command = new DescribeQueryDefinitionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Query Definitions Result",
      description: "Result from DescribeQueryDefinitions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          queryDefinitions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                queryLanguage: {
                  type: "string",
                },
                queryDefinitionId: {
                  type: "string",
                },
                name: {
                  type: "string",
                },
                queryString: {
                  type: "string",
                },
                lastModified: {
                  type: "number",
                },
                logGroupNames: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                parameters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      defaultValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      description: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["name"],
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "The list of query definitions that match your request.",
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

export default describeQueryDefinitions;

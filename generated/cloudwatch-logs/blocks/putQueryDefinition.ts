import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  PutQueryDefinitionCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putQueryDefinition: AppBlock = {
  name: "Put Query Definition",
  description: `Creates or updates a query definition for CloudWatch Logs Insights.`,
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
        name: {
          name: "name",
          description: "A name for the query definition.",
          type: "string",
          required: true,
        },
        queryDefinitionId: {
          name: "query Definition Id",
          description:
            "If you are updating a query definition, use this parameter to specify the ID of the query definition that you want to update.",
          type: "string",
          required: false,
        },
        logGroupNames: {
          name: "log Group Names",
          description:
            "Use this parameter to include specific log groups as part of your query definition.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        queryString: {
          name: "query String",
          description: "The query string to use for this definition.",
          type: "string",
          required: true,
        },
        clientToken: {
          name: "client Token",
          description:
            "Used as an idempotency token, to avoid returning an exception if the service receives the same request twice because of a network error.",
          type: "string",
          required: false,
        },
        parameters: {
          name: "parameters",
          description:
            "Use this parameter to include specific query parameters as part of your query definition.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                defaultValue: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
              },
              required: ["name"],
              additionalProperties: false,
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

        const command = new PutQueryDefinitionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Query Definition Result",
      description: "Result from PutQueryDefinition operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          queryDefinitionId: {
            type: "string",
            description: "The ID of the query definition.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putQueryDefinition;

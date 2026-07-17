import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  ListDurableExecutionsByFunctionCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const listDurableExecutionsByFunction: AppBlock = {
  name: "List Durable Executions By Function",
  description: `Returns a list of durable executions for a specified Lambda function.`,
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
        FunctionName: {
          name: "Function Name",
          description: "The name or ARN of the Lambda function.",
          type: "string",
          required: true,
        },
        Qualifier: {
          name: "Qualifier",
          description: "The function version or alias.",
          type: "string",
          required: false,
        },
        DurableExecutionName: {
          name: "Durable Execution Name",
          description: "Filter executions by name.",
          type: "string",
          required: false,
        },
        Statuses: {
          name: "Statuses",
          description: "Filter executions by status.",
          type: {
            type: "array",
            items: {
              type: "string",
              enum: ["RUNNING", "SUCCEEDED", "FAILED", "TIMED_OUT", "STOPPED"],
            },
          },
          required: false,
        },
        StartedAfter: {
          name: "Started After",
          description:
            "Filter executions that started after this timestamp (ISO 8601 format).",
          type: "string",
          required: false,
        },
        StartedBefore: {
          name: "Started Before",
          description:
            "Filter executions that started before this timestamp (ISO 8601 format).",
          type: "string",
          required: false,
        },
        ReverseOrder: {
          name: "Reverse Order",
          description:
            "Set to true to return results in reverse chronological order (newest first).",
          type: "boolean",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "Pagination token from a previous request to continue retrieving results.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description: "Maximum number of executions to return (1-1000).",
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListDurableExecutionsByFunctionCommand(
          convertTimestamps(
            commandInput,
            new Set(["StartedAfter", "StartedBefore"]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Durable Executions By Function Result",
      description: "Result from ListDurableExecutionsByFunction operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DurableExecutions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                DurableExecutionArn: {
                  type: "string",
                },
                DurableExecutionName: {
                  type: "string",
                },
                FunctionArn: {
                  type: "string",
                },
                Status: {
                  type: "string",
                  enum: [
                    "RUNNING",
                    "SUCCEEDED",
                    "FAILED",
                    "TIMED_OUT",
                    "STOPPED",
                  ],
                },
                StartTimestamp: {
                  type: "string",
                },
                EndTimestamp: {
                  type: "string",
                },
              },
              required: [
                "DurableExecutionArn",
                "DurableExecutionName",
                "FunctionArn",
                "Status",
                "StartTimestamp",
              ],
              additionalProperties: false,
            },
            description:
              "List of durable execution summaries matching the filter criteria.",
          },
          NextMarker: {
            type: "string",
            description: "Pagination token for retrieving additional results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listDurableExecutionsByFunction;

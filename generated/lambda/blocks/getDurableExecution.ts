import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  GetDurableExecutionCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getDurableExecution: AppBlock = {
  name: "Get Durable Execution",
  description: `Retrieves detailed information about a specific durable execution, including its current status, input payload, result or error information, and execution metadata such as start time and usage statistics.`,
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
        DurableExecutionArn: {
          name: "Durable Execution Arn",
          description:
            "The Amazon Resource Name (ARN) of the durable execution.",
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetDurableExecutionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Durable Execution Result",
      description: "Result from GetDurableExecution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DurableExecutionArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the durable execution.",
          },
          DurableExecutionName: {
            type: "string",
            description: "The name of the durable execution.",
          },
          FunctionArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the Lambda function that was invoked to start this durable execution.",
          },
          InputPayload: {
            type: "string",
            description:
              "The JSON input payload that was provided when the durable execution was started.",
          },
          Result: {
            type: "string",
            description:
              "The JSON result returned by the durable execution if it completed successfully.",
          },
          Error: {
            type: "object",
            properties: {
              ErrorMessage: {
                type: "string",
              },
              ErrorType: {
                type: "string",
              },
              ErrorData: {
                type: "string",
              },
              StackTrace: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
            description: "Error information if the durable execution failed.",
          },
          StartTimestamp: {
            type: "string",
            description:
              "The date and time when the durable execution started, in Unix timestamp format.",
          },
          Status: {
            type: "string",
            enum: ["RUNNING", "SUCCEEDED", "FAILED", "TIMED_OUT", "STOPPED"],
            description: "The current status of the durable execution.",
          },
          EndTimestamp: {
            type: "string",
            description:
              "The date and time when the durable execution ended, in Unix timestamp format.",
          },
          Version: {
            type: "string",
            description:
              "The version of the Lambda function that was invoked for this durable execution.",
          },
          TraceHeader: {
            type: "object",
            properties: {
              XAmznTraceId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The trace headers associated with the durable execution.",
          },
        },
        required: [
          "DurableExecutionArn",
          "DurableExecutionName",
          "FunctionArn",
          "StartTimestamp",
          "Status",
        ],
      },
    },
  },
};

export default getDurableExecution;

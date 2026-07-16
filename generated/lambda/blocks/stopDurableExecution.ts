import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  StopDurableExecutionCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const stopDurableExecution: AppBlock = {
  name: "Stop Durable Execution",
  description: `Stops a running durable execution.`,
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
        Error: {
          name: "Error",
          description:
            "Optional error details explaining why the execution is being stopped.",
          type: {
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new StopDurableExecutionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Stop Durable Execution Result",
      description: "Result from StopDurableExecution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StopTimestamp: {
            type: "string",
            description:
              "The timestamp when the execution was stopped (ISO 8601 format).",
          },
        },
        required: ["StopTimestamp"],
      },
    },
  },
};

export default stopDurableExecution;

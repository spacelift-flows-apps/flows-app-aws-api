import { AppBlock, events } from "@slflows/sdk/v1";
import { SFNClient, StartSyncExecutionCommand } from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startSyncExecution: AppBlock = {
  name: "Start Sync Execution",
  description: `Starts a Synchronous Express state machine execution.`,
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
        stateMachineArn: {
          name: "state Machine Arn",
          description:
            "The Amazon Resource Name (ARN) of the state machine to execute.",
          type: "string",
          required: true,
        },
        name: {
          name: "name",
          description: "The name of the execution.",
          type: "string",
          required: false,
        },
        input: {
          name: "input",
          description:
            'The string that contains the JSON input data for the execution, for example: "{\\"first_name\\" : \\"Alejandro\\"}" If you don\'t include any JSON input data, you still must include the two braces, for example: "{}" Length constraints apply to the payload size, and are expressed as bytes in UTF-8 encoding.',
          type: "string",
          required: false,
        },
        traceHeader: {
          name: "trace Header",
          description: "Passes the X-Ray trace header.",
          type: "string",
          required: false,
        },
        includedData: {
          name: "included Data",
          description:
            "If your state machine definition is encrypted with a KMS key, callers must have kms:Decrypt permission to decrypt the definition.",
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

        const client = new SFNClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new StartSyncExecutionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Sync Execution Result",
      description: "Result from StartSyncExecution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          executionArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) that identifies the execution.",
          },
          stateMachineArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) that identifies the state machine.",
          },
          name: {
            type: "string",
            description: "The name of the execution.",
          },
          startDate: {
            type: "string",
            description: "The date the execution is started.",
          },
          stopDate: {
            type: "string",
            description:
              "If the execution has already ended, the date the execution stopped.",
          },
          status: {
            type: "string",
            description: "The current status of the execution.",
          },
          error: {
            type: "string",
            description: "The error code of the failure.",
          },
          cause: {
            type: "string",
            description:
              "A more detailed explanation of the cause of the failure.",
          },
          input: {
            type: "string",
            description:
              "The string that contains the JSON input data of the execution.",
          },
          inputDetails: {
            type: "object",
            properties: {
              included: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description: "Provides details about execution input or output.",
          },
          output: {
            type: "string",
            description: "The JSON output data of the execution.",
          },
          outputDetails: {
            type: "object",
            properties: {
              included: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description: "Provides details about execution input or output.",
          },
          traceHeader: {
            type: "string",
            description:
              "The X-Ray trace header that was passed to the execution.",
          },
          billingDetails: {
            type: "object",
            properties: {
              billedMemoryUsedInMB: {
                type: "number",
              },
              billedDurationInMilliseconds: {
                type: "number",
              },
            },
            additionalProperties: false,
            description:
              "An object that describes workflow billing details, including billed duration and memory use.",
          },
        },
        required: ["executionArn", "startDate", "stopDate", "status"],
      },
    },
  },
};

export default startSyncExecution;

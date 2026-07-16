import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  CheckpointDurableExecutionCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const checkpointDurableExecution: AppBlock = {
  name: "Checkpoint Durable Execution",
  description: `Saves the progress of a durable function execution during runtime.`,
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
        CheckpointToken: {
          name: "Checkpoint Token",
          description:
            "A unique token that identifies the current checkpoint state.",
          type: "string",
          required: true,
        },
        Updates: {
          name: "Updates",
          description:
            "An array of state updates to apply during this checkpoint.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                ParentId: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                Type: {
                  type: "string",
                },
                SubType: {
                  type: "string",
                },
                Action: {
                  type: "string",
                },
                Payload: {
                  type: "string",
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
                },
                ContextOptions: {
                  type: "object",
                  properties: {
                    ReplayChildren: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
                StepOptions: {
                  type: "object",
                  properties: {
                    NextAttemptDelaySeconds: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                WaitOptions: {
                  type: "object",
                  properties: {
                    WaitSeconds: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                CallbackOptions: {
                  type: "object",
                  properties: {
                    TimeoutSeconds: {
                      type: "number",
                    },
                    HeartbeatTimeoutSeconds: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                ChainedInvokeOptions: {
                  type: "object",
                  properties: {
                    FunctionName: {
                      type: "string",
                    },
                    TenantId: {
                      type: "string",
                    },
                  },
                  required: ["FunctionName"],
                  additionalProperties: false,
                },
              },
              required: ["Id", "Type", "Action"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "An optional idempotency token to ensure that duplicate checkpoint requests are handled correctly.",
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CheckpointDurableExecutionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Checkpoint Durable Execution Result",
      description: "Result from CheckpointDurableExecution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CheckpointToken: {
            type: "string",
            description:
              "A new checkpoint token to use for the next checkpoint operation.",
          },
          NewExecutionState: {
            type: "object",
            properties: {
              Operations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Id: {
                      type: "string",
                    },
                    ParentId: {
                      type: "string",
                    },
                    Name: {
                      type: "string",
                    },
                    Type: {
                      type: "string",
                    },
                    SubType: {
                      type: "string",
                    },
                    StartTimestamp: {
                      type: "string",
                    },
                    EndTimestamp: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                    ExecutionDetails: {
                      type: "object",
                      properties: {
                        InputPayload: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                    ContextDetails: {
                      type: "object",
                      properties: {
                        ReplayChildren: {
                          type: "boolean",
                        },
                        Result: {
                          type: "string",
                        },
                        Error: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      additionalProperties: false,
                    },
                    StepDetails: {
                      type: "object",
                      properties: {
                        Attempt: {
                          type: "number",
                        },
                        NextAttemptTimestamp: {
                          type: "string",
                        },
                        Result: {
                          type: "string",
                        },
                        Error: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      additionalProperties: false,
                    },
                    WaitDetails: {
                      type: "object",
                      properties: {
                        ScheduledEndTimestamp: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                    CallbackDetails: {
                      type: "object",
                      properties: {
                        CallbackId: {
                          type: "string",
                        },
                        Result: {
                          type: "string",
                        },
                        Error: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      additionalProperties: false,
                    },
                    ChainedInvokeDetails: {
                      type: "object",
                      properties: {
                        Result: {
                          type: "string",
                        },
                        Error: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Id", "Type", "StartTimestamp", "Status"],
                  additionalProperties: false,
                },
              },
              NextMarker: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Updated execution state information that includes any changes that occurred since the last checkpoint, such as completed callbacks or expired timers.",
          },
        },
        required: ["NewExecutionState"],
      },
    },
  },
};

export default checkpointDurableExecution;

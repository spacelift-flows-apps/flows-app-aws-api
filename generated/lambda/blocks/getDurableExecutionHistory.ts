import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  GetDurableExecutionHistoryCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getDurableExecutionHistory: AppBlock = {
  name: "Get Durable Execution History",
  description: `Retrieves the execution history for a durable execution, showing all the steps, callbacks, and events that occurred during the execution.`,
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
        IncludeExecutionData: {
          name: "Include Execution Data",
          description:
            "Specifies whether to include execution data such as step results and callback payloads in the history events.",
          type: "boolean",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The maximum number of history events to return per call.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "If NextMarker was returned from a previous request, use this value to retrieve the next page of results.",
          type: "string",
          required: false,
        },
        ReverseOrder: {
          name: "Reverse Order",
          description:
            "When set to true, returns the history events in reverse chronological order (newest first).",
          type: "boolean",
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

        const command = new GetDurableExecutionHistoryCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Durable Execution History Result",
      description: "Result from GetDurableExecutionHistory operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                EventType: {
                  type: "string",
                  enum: [
                    "ExecutionStarted",
                    "ExecutionSucceeded",
                    "ExecutionFailed",
                    "ExecutionTimedOut",
                    "ExecutionStopped",
                    "ContextStarted",
                    "ContextSucceeded",
                    "ContextFailed",
                    "WaitStarted",
                    "WaitSucceeded",
                    "WaitCancelled",
                    "StepStarted",
                    "StepSucceeded",
                    "StepFailed",
                    "ChainedInvokeStarted",
                    "ChainedInvokeSucceeded",
                    "ChainedInvokeFailed",
                    "ChainedInvokeTimedOut",
                    "ChainedInvokeStopped",
                    "CallbackStarted",
                    "CallbackSucceeded",
                    "CallbackFailed",
                    "CallbackTimedOut",
                    "InvocationCompleted",
                  ],
                },
                SubType: {
                  type: "string",
                },
                EventId: {
                  type: "number",
                },
                Id: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                EventTimestamp: {
                  type: "string",
                },
                ParentId: {
                  type: "string",
                },
                ExecutionStartedDetails: {
                  type: "object",
                  properties: {
                    Input: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "string",
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                    ExecutionTimeout: {
                      type: "number",
                    },
                  },
                  required: ["Input", "ExecutionTimeout"],
                  additionalProperties: false,
                },
                ExecutionSucceededDetails: {
                  type: "object",
                  properties: {
                    Result: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "string",
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Result"],
                  additionalProperties: false,
                },
                ExecutionFailedDetails: {
                  type: "object",
                  properties: {
                    Error: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Error"],
                  additionalProperties: false,
                },
                ExecutionTimedOutDetails: {
                  type: "object",
                  properties: {
                    Error: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                ExecutionStoppedDetails: {
                  type: "object",
                  properties: {
                    Error: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Error"],
                  additionalProperties: false,
                },
                ContextStartedDetails: {
                  type: "object",
                  properties: {},
                  additionalProperties: false,
                },
                ContextSucceededDetails: {
                  type: "object",
                  properties: {
                    Result: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "string",
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Result"],
                  additionalProperties: false,
                },
                ContextFailedDetails: {
                  type: "object",
                  properties: {
                    Error: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Error"],
                  additionalProperties: false,
                },
                WaitStartedDetails: {
                  type: "object",
                  properties: {
                    Duration: {
                      type: "number",
                    },
                    ScheduledEndTimestamp: {
                      type: "string",
                    },
                  },
                  required: ["Duration", "ScheduledEndTimestamp"],
                  additionalProperties: false,
                },
                WaitSucceededDetails: {
                  type: "object",
                  properties: {
                    Duration: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                WaitCancelledDetails: {
                  type: "object",
                  properties: {
                    Error: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                StepStartedDetails: {
                  type: "object",
                  properties: {},
                  additionalProperties: false,
                },
                StepSucceededDetails: {
                  type: "object",
                  properties: {
                    Result: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "string",
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                    RetryDetails: {
                      type: "object",
                      properties: {
                        CurrentAttempt: {
                          type: "number",
                        },
                        NextAttemptDelaySeconds: {
                          type: "number",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Result", "RetryDetails"],
                  additionalProperties: false,
                },
                StepFailedDetails: {
                  type: "object",
                  properties: {
                    Error: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                    RetryDetails: {
                      type: "object",
                      properties: {
                        CurrentAttempt: {
                          type: "number",
                        },
                        NextAttemptDelaySeconds: {
                          type: "number",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Error", "RetryDetails"],
                  additionalProperties: false,
                },
                ChainedInvokeStartedDetails: {
                  type: "object",
                  properties: {
                    FunctionName: {
                      type: "string",
                    },
                    TenantId: {
                      type: "string",
                    },
                    Input: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "string",
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                    ExecutedVersion: {
                      type: "string",
                    },
                    DurableExecutionArn: {
                      type: "string",
                    },
                  },
                  required: ["FunctionName"],
                  additionalProperties: false,
                },
                ChainedInvokeSucceededDetails: {
                  type: "object",
                  properties: {
                    Result: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "string",
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Result"],
                  additionalProperties: false,
                },
                ChainedInvokeFailedDetails: {
                  type: "object",
                  properties: {
                    Error: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Error"],
                  additionalProperties: false,
                },
                ChainedInvokeTimedOutDetails: {
                  type: "object",
                  properties: {
                    Error: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Error"],
                  additionalProperties: false,
                },
                ChainedInvokeStoppedDetails: {
                  type: "object",
                  properties: {
                    Error: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Error"],
                  additionalProperties: false,
                },
                CallbackStartedDetails: {
                  type: "object",
                  properties: {
                    CallbackId: {
                      type: "string",
                    },
                    HeartbeatTimeout: {
                      type: "number",
                    },
                    Timeout: {
                      type: "number",
                    },
                  },
                  required: ["CallbackId"],
                  additionalProperties: false,
                },
                CallbackSucceededDetails: {
                  type: "object",
                  properties: {
                    Result: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "string",
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Result"],
                  additionalProperties: false,
                },
                CallbackFailedDetails: {
                  type: "object",
                  properties: {
                    Error: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Error"],
                  additionalProperties: false,
                },
                CallbackTimedOutDetails: {
                  type: "object",
                  properties: {
                    Error: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Error"],
                  additionalProperties: false,
                },
                InvocationCompletedDetails: {
                  type: "object",
                  properties: {
                    StartTimestamp: {
                      type: "string",
                    },
                    EndTimestamp: {
                      type: "string",
                    },
                    RequestId: {
                      type: "string",
                    },
                    Error: {
                      type: "object",
                      properties: {
                        Payload: {
                          type: "object",
                          properties: {
                            ErrorMessage: {},
                            ErrorType: {},
                            ErrorData: {},
                            StackTrace: {},
                          },
                          additionalProperties: false,
                        },
                        Truncated: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["StartTimestamp", "EndTimestamp", "RequestId"],
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description:
              "An array of execution history events, ordered chronologically unless ReverseOrder is set to true.",
          },
          NextMarker: {
            type: "string",
            description:
              "If present, indicates that more history events are available.",
          },
        },
        required: ["Events"],
      },
    },
  },
};

export default getDurableExecutionHistory;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  GetDurableExecutionStateCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getDurableExecutionState: AppBlock = {
  name: "Get Durable Execution State",
  description: `Retrieves the current execution state required for the replay process during durable function execution.`,
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
            "A checkpoint token that identifies the current state of the execution.",
          type: "string",
          required: true,
        },
        Marker: {
          name: "Marker",
          description:
            "If NextMarker was returned from a previous request, use this value to retrieve the next page of operations.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description: "The maximum number of operations to return per call.",
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

        const command = new GetDurableExecutionStateCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Durable Execution State Result",
      description: "Result from GetDurableExecutionState operation",
      possiblePrimaryParents: ["default"],
      type: {
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
                          items: {},
                        },
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
                          items: {},
                        },
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
                          items: {},
                        },
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
                          items: {},
                        },
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
            description:
              "An array of operations that represent the current state of the durable execution.",
          },
          NextMarker: {
            type: "string",
            description:
              "If present, indicates that more operations are available.",
          },
        },
        required: ["Operations"],
      },
    },
  },
};

export default getDurableExecutionState;

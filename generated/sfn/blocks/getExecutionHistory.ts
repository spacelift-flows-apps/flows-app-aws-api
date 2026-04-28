import { AppBlock, events } from "@slflows/sdk/v1";
import { SFNClient, GetExecutionHistoryCommand } from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getExecutionHistory: AppBlock = {
  name: "Get Execution History",
  description: `Returns the history of the specified execution as a list of events.`,
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
        executionArn: {
          name: "execution Arn",
          description: "The Amazon Resource Name (ARN) of the execution.",
          type: "string",
          required: true,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of results that are returned per call.",
          type: "number",
          required: false,
        },
        reverseOrder: {
          name: "reverse Order",
          description: "Lists events in descending order of their timeStamp.",
          type: "boolean",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "If nextToken is returned, there are more results available.",
          type: "string",
          required: false,
        },
        includeExecutionData: {
          name: "include Execution Data",
          description:
            "You can select whether execution data (input or output of a history event) is returned.",
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

        const client = new SFNClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetExecutionHistoryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Execution History Result",
      description: "Result from GetExecutionHistory operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                timestamp: {
                  type: "string",
                },
                type: {
                  type: "string",
                },
                id: {
                  type: "number",
                },
                previousEventId: {
                  type: "number",
                },
                activityFailedEventDetails: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                activityScheduleFailedEventDetails: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                activityScheduledEventDetails: {
                  type: "object",
                  properties: {
                    resource: {
                      type: "string",
                    },
                    input: {
                      type: "string",
                    },
                    inputDetails: {
                      type: "object",
                      properties: {
                        truncated: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    timeoutInSeconds: {
                      type: "number",
                    },
                    heartbeatInSeconds: {
                      type: "number",
                    },
                  },
                  required: ["resource"],
                  additionalProperties: false,
                },
                activityStartedEventDetails: {
                  type: "object",
                  properties: {
                    workerName: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                activitySucceededEventDetails: {
                  type: "object",
                  properties: {
                    output: {
                      type: "string",
                    },
                    outputDetails: {
                      type: "object",
                      properties: {
                        truncated: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                activityTimedOutEventDetails: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                taskFailedEventDetails: {
                  type: "object",
                  properties: {
                    resourceType: {
                      type: "string",
                    },
                    resource: {
                      type: "string",
                    },
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  required: ["resourceType", "resource"],
                  additionalProperties: false,
                },
                taskScheduledEventDetails: {
                  type: "object",
                  properties: {
                    resourceType: {
                      type: "string",
                    },
                    resource: {
                      type: "string",
                    },
                    region: {
                      type: "string",
                    },
                    parameters: {
                      type: "string",
                    },
                    timeoutInSeconds: {
                      type: "number",
                    },
                    heartbeatInSeconds: {
                      type: "number",
                    },
                    taskCredentials: {
                      type: "object",
                      properties: {
                        roleArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: [
                    "resourceType",
                    "resource",
                    "region",
                    "parameters",
                  ],
                  additionalProperties: false,
                },
                taskStartFailedEventDetails: {
                  type: "object",
                  properties: {
                    resourceType: {
                      type: "string",
                    },
                    resource: {
                      type: "string",
                    },
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  required: ["resourceType", "resource"],
                  additionalProperties: false,
                },
                taskStartedEventDetails: {
                  type: "object",
                  properties: {
                    resourceType: {
                      type: "string",
                    },
                    resource: {
                      type: "string",
                    },
                  },
                  required: ["resourceType", "resource"],
                  additionalProperties: false,
                },
                taskSubmitFailedEventDetails: {
                  type: "object",
                  properties: {
                    resourceType: {
                      type: "string",
                    },
                    resource: {
                      type: "string",
                    },
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  required: ["resourceType", "resource"],
                  additionalProperties: false,
                },
                taskSubmittedEventDetails: {
                  type: "object",
                  properties: {
                    resourceType: {
                      type: "string",
                    },
                    resource: {
                      type: "string",
                    },
                    output: {
                      type: "string",
                    },
                    outputDetails: {
                      type: "object",
                      properties: {
                        truncated: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["resourceType", "resource"],
                  additionalProperties: false,
                },
                taskSucceededEventDetails: {
                  type: "object",
                  properties: {
                    resourceType: {
                      type: "string",
                    },
                    resource: {
                      type: "string",
                    },
                    output: {
                      type: "string",
                    },
                    outputDetails: {
                      type: "object",
                      properties: {
                        truncated: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["resourceType", "resource"],
                  additionalProperties: false,
                },
                taskTimedOutEventDetails: {
                  type: "object",
                  properties: {
                    resourceType: {
                      type: "string",
                    },
                    resource: {
                      type: "string",
                    },
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  required: ["resourceType", "resource"],
                  additionalProperties: false,
                },
                executionFailedEventDetails: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                executionStartedEventDetails: {
                  type: "object",
                  properties: {
                    input: {
                      type: "string",
                    },
                    inputDetails: {
                      type: "object",
                      properties: {
                        truncated: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    roleArn: {
                      type: "string",
                    },
                    stateMachineAliasArn: {
                      type: "string",
                    },
                    stateMachineVersionArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                executionSucceededEventDetails: {
                  type: "object",
                  properties: {
                    output: {
                      type: "string",
                    },
                    outputDetails: {
                      type: "object",
                      properties: {
                        truncated: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                executionAbortedEventDetails: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                executionTimedOutEventDetails: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                executionRedrivenEventDetails: {
                  type: "object",
                  properties: {
                    redriveCount: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                mapStateStartedEventDetails: {
                  type: "object",
                  properties: {
                    length: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                mapIterationStartedEventDetails: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    index: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                mapIterationSucceededEventDetails: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    index: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                mapIterationFailedEventDetails: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    index: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                mapIterationAbortedEventDetails: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    index: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                lambdaFunctionFailedEventDetails: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                lambdaFunctionScheduleFailedEventDetails: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                lambdaFunctionScheduledEventDetails: {
                  type: "object",
                  properties: {
                    resource: {
                      type: "string",
                    },
                    input: {
                      type: "string",
                    },
                    inputDetails: {
                      type: "object",
                      properties: {
                        truncated: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    timeoutInSeconds: {
                      type: "number",
                    },
                    taskCredentials: {
                      type: "object",
                      properties: {
                        roleArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["resource"],
                  additionalProperties: false,
                },
                lambdaFunctionStartFailedEventDetails: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                lambdaFunctionSucceededEventDetails: {
                  type: "object",
                  properties: {
                    output: {
                      type: "string",
                    },
                    outputDetails: {
                      type: "object",
                      properties: {
                        truncated: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                lambdaFunctionTimedOutEventDetails: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                stateEnteredEventDetails: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    input: {
                      type: "string",
                    },
                    inputDetails: {
                      type: "object",
                      properties: {
                        truncated: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["name"],
                  additionalProperties: false,
                },
                stateExitedEventDetails: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    output: {
                      type: "string",
                    },
                    outputDetails: {
                      type: "object",
                      properties: {
                        truncated: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    assignedVariables: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                    assignedVariablesDetails: {
                      type: "object",
                      properties: {
                        truncated: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["name"],
                  additionalProperties: false,
                },
                mapRunStartedEventDetails: {
                  type: "object",
                  properties: {
                    mapRunArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                mapRunFailedEventDetails: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                mapRunRedrivenEventDetails: {
                  type: "object",
                  properties: {
                    mapRunArn: {
                      type: "string",
                    },
                    redriveCount: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                evaluationFailedEventDetails: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                    },
                    cause: {
                      type: "string",
                    },
                    location: {
                      type: "string",
                    },
                    state: {
                      type: "string",
                    },
                  },
                  required: ["state"],
                  additionalProperties: false,
                },
              },
              required: ["timestamp", "type", "id"],
              additionalProperties: false,
            },
            description: "The list of events that occurred in the execution.",
          },
          nextToken: {
            type: "string",
            description:
              "If nextToken is returned, there are more results available.",
          },
        },
        required: ["events"],
      },
    },
  },
};

export default getExecutionHistory;

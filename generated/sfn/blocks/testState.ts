import { AppBlock, events } from "@slflows/sdk/v1";
import { SFNClient, TestStateCommand } from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const testState: AppBlock = {
  name: "Test State",
  description: `Accepts the definition of a single state and executes it.`,
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
        definition: {
          name: "definition",
          description:
            "The Amazon States Language (ASL) definition of the state or state machine.",
          type: "string",
          required: true,
        },
        roleArn: {
          name: "role Arn",
          description:
            "The Amazon Resource Name (ARN) of the execution role with the required IAM permissions for the state.",
          type: "string",
          required: false,
        },
        input: {
          name: "input",
          description:
            "A string that contains the JSON input data for the state.",
          type: "string",
          required: false,
        },
        inspectionLevel: {
          name: "inspection Level",
          description:
            "Determines the values to return when a state is tested.",
          type: "string",
          required: false,
        },
        revealSecrets: {
          name: "reveal Secrets",
          description:
            "Specifies whether or not to include secret information in the test result.",
          type: "boolean",
          required: false,
        },
        variables: {
          name: "variables",
          description:
            "JSON object literal that sets variables used in the state under test.",
          type: "string",
          required: false,
        },
        stateName: {
          name: "state Name",
          description:
            "Denotes the particular state within a state machine definition to be tested.",
          type: "string",
          required: false,
        },
        mock: {
          name: "mock",
          description:
            "Defines a mocked result or error for the state under test.",
          type: {
            type: "object",
            properties: {
              result: {
                type: "string",
              },
              errorOutput: {
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
              fieldValidationMode: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        context: {
          name: "context",
          description:
            "A JSON string representing a valid Context object for the state under test.",
          type: "string",
          required: false,
        },
        stateConfiguration: {
          name: "state Configuration",
          description: "Contains configurations for the state under test.",
          type: {
            type: "object",
            properties: {
              retrierRetryCount: {
                type: "number",
              },
              errorCausedByState: {
                type: "string",
              },
              mapIterationFailureCount: {
                type: "number",
              },
              mapItemReaderData: {
                type: "string",
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

        const client = new SFNClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new TestStateCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Test State Result",
      description: "Result from TestState operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          output: {
            type: "string",
            description: "The JSON output data of the state.",
          },
          error: {
            type: "string",
            description:
              "The error returned when the execution of a state fails.",
          },
          cause: {
            type: "string",
            description:
              "A detailed explanation of the cause for the error when the execution of a state fails.",
          },
          inspectionData: {
            type: "object",
            properties: {
              input: {
                type: "string",
              },
              afterArguments: {
                type: "string",
              },
              afterInputPath: {
                type: "string",
              },
              afterParameters: {
                type: "string",
              },
              result: {
                type: "string",
              },
              afterResultSelector: {
                type: "string",
              },
              afterResultPath: {
                type: "string",
              },
              request: {
                type: "object",
                properties: {
                  protocol: {
                    type: "string",
                  },
                  method: {
                    type: "string",
                  },
                  url: {
                    type: "string",
                  },
                  headers: {
                    type: "string",
                  },
                  body: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              response: {
                type: "object",
                properties: {
                  protocol: {
                    type: "string",
                  },
                  statusCode: {
                    type: "string",
                  },
                  statusMessage: {
                    type: "string",
                  },
                  headers: {
                    type: "string",
                  },
                  body: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              variables: {
                type: "string",
              },
              errorDetails: {
                type: "object",
                properties: {
                  catchIndex: {
                    type: "number",
                  },
                  retryIndex: {
                    type: "number",
                  },
                  retryBackoffIntervalSeconds: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              afterItemsPath: {
                type: "string",
              },
              afterItemSelector: {
                type: "string",
              },
              afterItemBatcher: {
                type: "string",
              },
              afterItemsPointer: {
                type: "string",
              },
              toleratedFailureCount: {
                type: "number",
              },
              toleratedFailurePercentage: {
                type: "number",
              },
              maxConcurrency: {
                type: "number",
              },
            },
            additionalProperties: false,
            description:
              "Returns additional details about the state's execution, including its input and output data processing flow, and HTTP request and response information.",
          },
          nextState: {
            type: "string",
            description: "The name of the next state to transition to.",
          },
          status: {
            type: "string",
            description: "The execution status of the state.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default testState;

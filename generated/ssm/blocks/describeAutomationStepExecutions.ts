import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  DescribeAutomationStepExecutionsCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAutomationStepExecutions: AppBlock = {
  name: "Describe Automation Step Executions",
  description: `Information about all active and terminated step executions in an Automation workflow.`,
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
        AutomationExecutionId: {
          name: "Automation Execution Id",
          description:
            "The Automation execution ID for which you want step execution descriptions.",
          type: "string",
          required: true,
        },
        Filters: {
          name: "Filters",
          description:
            "One or more filters to limit the number of step executions returned by the request.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["Key", "Values"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return for this call.",
          type: "number",
          required: false,
        },
        ReverseOrder: {
          name: "Reverse Order",
          description:
            "Indicates whether to list step executions in reverse order by start time.",
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
            credentials: {
              accessKeyId: input.app.config.accessKeyId,
              secretAccessKey: input.app.config.secretAccessKey,
              sessionToken: input.app.config.sessionToken,
            },
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeAutomationStepExecutionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Automation Step Executions Result",
      description: "Result from DescribeAutomationStepExecutions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StepExecutions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                StepName: {
                  type: "string",
                },
                Action: {
                  type: "string",
                },
                TimeoutSeconds: {
                  type: "number",
                },
                OnFailure: {
                  type: "string",
                },
                MaxAttempts: {
                  type: "number",
                },
                ExecutionStartTime: {
                  type: "string",
                },
                ExecutionEndTime: {
                  type: "string",
                },
                StepStatus: {
                  type: "string",
                },
                ResponseCode: {
                  type: "string",
                },
                Inputs: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
                Outputs: {
                  type: "object",
                  additionalProperties: {
                    type: "array",
                  },
                },
                Response: {
                  type: "string",
                },
                FailureMessage: {
                  type: "string",
                },
                FailureDetails: {
                  type: "object",
                  properties: {
                    FailureStage: {
                      type: "string",
                    },
                    FailureType: {
                      type: "string",
                    },
                    Details: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                  },
                  additionalProperties: false,
                },
                StepExecutionId: {
                  type: "string",
                },
                OverriddenParameters: {
                  type: "object",
                  additionalProperties: {
                    type: "array",
                  },
                },
                IsEnd: {
                  type: "boolean",
                },
                NextStep: {
                  type: "string",
                },
                IsCritical: {
                  type: "boolean",
                },
                ValidNextSteps: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                Targets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Values: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                TargetLocation: {
                  type: "object",
                  properties: {
                    Accounts: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Regions: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    TargetLocationMaxConcurrency: {
                      type: "string",
                    },
                    TargetLocationMaxErrors: {
                      type: "string",
                    },
                    ExecutionRoleName: {
                      type: "string",
                    },
                    TargetLocationAlarmConfiguration: {
                      type: "object",
                      properties: {
                        IgnorePollAlarmFailure: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Alarms: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Alarms"],
                      additionalProperties: false,
                    },
                    IncludeChildOrganizationUnits: {
                      type: "boolean",
                    },
                    ExcludeAccounts: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Targets: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    TargetsMaxConcurrency: {
                      type: "string",
                    },
                    TargetsMaxErrors: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                TriggeredAlarms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      State: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Name", "State"],
                    additionalProperties: false,
                  },
                },
                ParentStepDetails: {
                  type: "object",
                  properties: {
                    StepExecutionId: {
                      type: "string",
                    },
                    StepName: {
                      type: "string",
                    },
                    Action: {
                      type: "string",
                    },
                    Iteration: {
                      type: "number",
                    },
                    IteratorValue: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of details about the current state of all steps that make up an execution.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to use when requesting the next set of items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeAutomationStepExecutions;

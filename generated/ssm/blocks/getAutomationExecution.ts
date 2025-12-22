import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, GetAutomationExecutionCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getAutomationExecution: AppBlock = {
  name: "Get Automation Execution",
  description: `Get detailed information about a particular Automation execution.`,
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
            "The unique identifier for an existing automation execution to examine.",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetAutomationExecutionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Automation Execution Result",
      description: "Result from GetAutomationExecution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AutomationExecution: {
            type: "object",
            properties: {
              AutomationExecutionId: {
                type: "string",
              },
              DocumentName: {
                type: "string",
              },
              DocumentVersion: {
                type: "string",
              },
              ExecutionStartTime: {
                type: "string",
              },
              ExecutionEndTime: {
                type: "string",
              },
              AutomationExecutionStatus: {
                type: "string",
              },
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
                        type: "object",
                      },
                    },
                    Outputs: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
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
                          type: "object",
                          additionalProperties: true,
                        },
                        FailureType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Details: {
                          type: "object",
                          additionalProperties: true,
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
                        type: "object",
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
                    TargetLocation: {
                      type: "object",
                      properties: {
                        Accounts: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Regions: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TargetLocationMaxConcurrency: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TargetLocationMaxErrors: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ExecutionRoleName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TargetLocationAlarmConfiguration: {
                          type: "object",
                          additionalProperties: true,
                        },
                        IncludeChildOrganizationUnits: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ExcludeAccounts: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Targets: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TargetsMaxConcurrency: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TargetsMaxErrors: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    TriggeredAlarms: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    ParentStepDetails: {
                      type: "object",
                      properties: {
                        StepExecutionId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        StepName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Action: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Iteration: {
                          type: "object",
                          additionalProperties: true,
                        },
                        IteratorValue: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              StepExecutionsTruncated: {
                type: "boolean",
              },
              Parameters: {
                type: "object",
                additionalProperties: {
                  type: "array",
                },
              },
              Outputs: {
                type: "object",
                additionalProperties: {
                  type: "array",
                },
              },
              FailureMessage: {
                type: "string",
              },
              Mode: {
                type: "string",
              },
              ParentAutomationExecutionId: {
                type: "string",
              },
              ExecutedBy: {
                type: "string",
              },
              CurrentStepName: {
                type: "string",
              },
              CurrentAction: {
                type: "string",
              },
              TargetParameterName: {
                type: "string",
              },
              Targets: {
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
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              TargetMaps: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: {
                    type: "array",
                  },
                },
              },
              ResolvedTargets: {
                type: "object",
                properties: {
                  ParameterValues: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  Truncated: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              MaxConcurrency: {
                type: "string",
              },
              MaxErrors: {
                type: "string",
              },
              Target: {
                type: "string",
              },
              TargetLocations: {
                type: "array",
                items: {
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
              },
              ProgressCounters: {
                type: "object",
                properties: {
                  TotalSteps: {
                    type: "number",
                  },
                  SuccessSteps: {
                    type: "number",
                  },
                  FailedSteps: {
                    type: "number",
                  },
                  CancelledSteps: {
                    type: "number",
                  },
                  TimedOutSteps: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              AlarmConfiguration: {
                type: "object",
                properties: {
                  IgnorePollAlarmFailure: {
                    type: "boolean",
                  },
                  Alarms: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Name: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Name"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["Alarms"],
                additionalProperties: false,
              },
              TriggeredAlarms: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                    State: {
                      type: "string",
                    },
                  },
                  required: ["Name", "State"],
                  additionalProperties: false,
                },
              },
              TargetLocationsURL: {
                type: "string",
              },
              AutomationSubtype: {
                type: "string",
              },
              ScheduledTime: {
                type: "string",
              },
              Runbooks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DocumentName: {
                      type: "string",
                    },
                    DocumentVersion: {
                      type: "string",
                    },
                    Parameters: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                    TargetParameterName: {
                      type: "string",
                    },
                    Targets: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    TargetMaps: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    MaxConcurrency: {
                      type: "string",
                    },
                    MaxErrors: {
                      type: "string",
                    },
                    TargetLocations: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["DocumentName"],
                  additionalProperties: false,
                },
              },
              OpsItemId: {
                type: "string",
              },
              AssociationId: {
                type: "string",
              },
              ChangeRequestName: {
                type: "string",
              },
              Variables: {
                type: "object",
                additionalProperties: {
                  type: "array",
                },
              },
            },
            additionalProperties: false,
            description:
              "Detailed information about the current state of an automation execution.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getAutomationExecution;

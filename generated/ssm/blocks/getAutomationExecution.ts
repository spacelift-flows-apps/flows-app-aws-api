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
                enum: [
                  "Pending",
                  "InProgress",
                  "Waiting",
                  "Success",
                  "TimedOut",
                  "Cancelling",
                  "Cancelled",
                  "Failed",
                  "PendingApproval",
                  "Approved",
                  "Rejected",
                  "Scheduled",
                  "RunbookInProgress",
                  "PendingChangeCalendarOverride",
                  "ChangeCalendarOverrideApproved",
                  "ChangeCalendarOverrideRejected",
                  "CompletedWithSuccess",
                  "CompletedWithFailure",
                  "Exited",
                ],
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
                      enum: [
                        "Pending",
                        "InProgress",
                        "Waiting",
                        "Success",
                        "TimedOut",
                        "Cancelling",
                        "Cancelled",
                        "Failed",
                        "PendingApproval",
                        "Approved",
                        "Rejected",
                        "Scheduled",
                        "RunbookInProgress",
                        "PendingChangeCalendarOverride",
                        "ChangeCalendarOverrideApproved",
                        "ChangeCalendarOverrideRejected",
                        "CompletedWithSuccess",
                        "CompletedWithFailure",
                        "Exited",
                      ],
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
                          Key: {},
                          Values: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    TargetLocation: {
                      type: "object",
                      properties: {
                        Accounts: {
                          type: "array",
                          items: {},
                        },
                        Regions: {
                          type: "array",
                          items: {},
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
                            IgnorePollAlarmFailure: {},
                            Alarms: {},
                          },
                          required: ["Alarms"],
                          additionalProperties: false,
                        },
                        IncludeChildOrganizationUnits: {
                          type: "boolean",
                        },
                        ExcludeAccounts: {
                          type: "array",
                          items: {},
                        },
                        Targets: {
                          type: "array",
                          items: {},
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
                          Name: {},
                          State: {},
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
                enum: ["Auto", "Interactive"],
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
                        type: "string",
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
                        type: "string",
                      },
                    },
                    Regions: {
                      type: "array",
                      items: {
                        type: "string",
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
                          type: "boolean",
                        },
                        Alarms: {
                          type: "array",
                          items: {},
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
                        type: "string",
                      },
                    },
                    Targets: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Key: {},
                          Values: {},
                        },
                        additionalProperties: false,
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
                          type: "string",
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
                      enum: ["UNKNOWN", "ALARM"],
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
                enum: ["ChangeRequest", "AccessRequest"],
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
                        type: "array",
                      },
                    },
                    TargetParameterName: {
                      type: "string",
                    },
                    Targets: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Key: {},
                          Values: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    TargetMaps: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: {
                          type: "object",
                        },
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
                        properties: {
                          Accounts: {},
                          Regions: {},
                          TargetLocationMaxConcurrency: {},
                          TargetLocationMaxErrors: {},
                          ExecutionRoleName: {},
                          TargetLocationAlarmConfiguration: {},
                          IncludeChildOrganizationUnits: {},
                          ExcludeAccounts: {},
                          Targets: {},
                          TargetsMaxConcurrency: {},
                          TargetsMaxErrors: {},
                        },
                        additionalProperties: false,
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

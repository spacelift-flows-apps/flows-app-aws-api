import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  DescribeAutomationExecutionsCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAutomationExecutions: AppBlock = {
  name: "Describe Automation Executions",
  description: `Provides details about all active and terminated Automation executions.`,
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
        Filters: {
          name: "Filters",
          description:
            "Filters used to limit the scope of executions that are requested.",
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
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return for this call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeAutomationExecutionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Automation Executions Result",
      description: "Result from DescribeAutomationExecutions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AutomationExecutionMetadataList: {
            type: "array",
            items: {
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
                AutomationExecutionStatus: {
                  type: "string",
                },
                ExecutionStartTime: {
                  type: "string",
                },
                ExecutionEndTime: {
                  type: "string",
                },
                ExecutedBy: {
                  type: "string",
                },
                LogFile: {
                  type: "string",
                },
                Outputs: {
                  type: "object",
                  additionalProperties: {
                    type: "array",
                  },
                },
                Mode: {
                  type: "string",
                },
                ParentAutomationExecutionId: {
                  type: "string",
                },
                CurrentStepName: {
                  type: "string",
                },
                CurrentAction: {
                  type: "string",
                },
                FailureMessage: {
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
                TargetMaps: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: {
                      type: "object",
                    },
                  },
                },
                ResolvedTargets: {
                  type: "object",
                  properties: {
                    ParameterValues: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
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
                AutomationType: {
                  type: "string",
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
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      DocumentVersion: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Parameters: {
                        type: "object",
                        additionalProperties: true,
                      },
                      TargetParameterName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Targets: {
                        type: "object",
                        additionalProperties: true,
                      },
                      TargetMaps: {
                        type: "object",
                        additionalProperties: true,
                      },
                      MaxConcurrency: {
                        type: "object",
                        additionalProperties: true,
                      },
                      MaxErrors: {
                        type: "object",
                        additionalProperties: true,
                      },
                      TargetLocations: {
                        type: "object",
                        additionalProperties: true,
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
              },
              additionalProperties: false,
            },
            description:
              "The list of details about each automation execution which has occurred which matches the filter specification, if any.",
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

export default describeAutomationExecutions;

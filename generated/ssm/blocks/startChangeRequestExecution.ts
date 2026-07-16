import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  StartChangeRequestExecutionCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const startChangeRequestExecution: AppBlock = {
  name: "Start Change Request Execution",
  description: `Amazon Web Services Systems Manager Change Manager is no longer open to new customers.`,
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
        ScheduledTime: {
          name: "Scheduled Time",
          description:
            "The date and time specified in the change request to run the Automation runbooks.",
          type: "string",
          required: false,
        },
        DocumentName: {
          name: "Document Name",
          description:
            "The name of the change template document to run during the runbook workflow.",
          type: "string",
          required: true,
        },
        DocumentVersion: {
          name: "Document Version",
          description:
            "The version of the change template document to run during the runbook workflow.",
          type: "string",
          required: false,
        },
        Parameters: {
          name: "Parameters",
          description:
            "A key-value map of parameters that match the declared parameters in the change template document.",
          type: {
            type: "object",
            additionalProperties: {
              type: "array",
            },
          },
          required: false,
        },
        ChangeRequestName: {
          name: "Change Request Name",
          description:
            "The name of the change request associated with the runbook workflow to be run.",
          type: "string",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description: "The user-provided idempotency token.",
          type: "string",
          required: false,
        },
        AutoApprove: {
          name: "Auto Approve",
          description:
            "Indicates whether the change request can be approved automatically without the need for manual approvals.",
          type: "boolean",
          required: false,
        },
        Runbooks: {
          name: "Runbooks",
          description:
            "Information about the Automation runbooks that are run during the runbook workflow.",
          type: {
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
                      Key: {
                        type: "string",
                      },
                      Values: {
                        type: "array",
                        items: {},
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
                },
              },
              required: ["DocumentName"],
              additionalProperties: false,
            },
          },
          required: true,
        },
        Tags: {
          name: "Tags",
          description: "Optional metadata that you assign to a resource.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              required: ["Key", "Value"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        ScheduledEndTime: {
          name: "Scheduled End Time",
          description:
            "The time that the requester expects the runbook workflow related to the change request to complete.",
          type: "string",
          required: false,
        },
        ChangeDetails: {
          name: "Change Details",
          description: "User-provided details about the change.",
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

        const command = new StartChangeRequestExecutionCommand(
          convertTimestamps(
            commandInput,
            new Set(["ScheduledTime", "ScheduledEndTime"]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Change Request Execution Result",
      description: "Result from StartChangeRequestExecution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AutomationExecutionId: {
            type: "string",
            description: "The unique ID of a runbook workflow operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startChangeRequestExecution;

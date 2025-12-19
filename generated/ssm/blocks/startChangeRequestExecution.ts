import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  StartChangeRequestExecutionCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startChangeRequestExecution: AppBlock = {
  name: "Start Change Request Execution",
  description: `Creates a change request for Change Manager.`,
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

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
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
          commandInput as any,
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

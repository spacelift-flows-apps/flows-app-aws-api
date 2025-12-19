import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  StartAutomationExecutionCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startAutomationExecution: AppBlock = {
  name: "Start Automation Execution",
  description: `Initiates execution of an Automation runbook.`,
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
        DocumentName: {
          name: "Document Name",
          description: "The name of the SSM document to run.",
          type: "string",
          required: true,
        },
        DocumentVersion: {
          name: "Document Version",
          description:
            "The version of the Automation runbook to use for this execution.",
          type: "string",
          required: false,
        },
        Parameters: {
          name: "Parameters",
          description:
            "A key-value map of execution parameters, which match the declared parameters in the Automation runbook.",
          type: {
            type: "object",
            additionalProperties: {
              type: "array",
            },
          },
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description: "User-provided idempotency token.",
          type: "string",
          required: false,
        },
        Mode: {
          name: "Mode",
          description: "The execution mode of the automation.",
          type: "string",
          required: false,
        },
        TargetParameterName: {
          name: "Target Parameter Name",
          description:
            "The name of the parameter used as the target resource for the rate-controlled execution.",
          type: "string",
          required: false,
        },
        Targets: {
          name: "Targets",
          description: "A key-value mapping to target resources.",
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
              additionalProperties: false,
            },
          },
          required: false,
        },
        TargetMaps: {
          name: "Target Maps",
          description:
            "A key-value mapping of document parameters to target resources.",
          type: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: {
                type: "array",
              },
            },
          },
          required: false,
        },
        MaxConcurrency: {
          name: "Max Concurrency",
          description:
            "The maximum number of targets allowed to run this task in parallel.",
          type: "string",
          required: false,
        },
        MaxErrors: {
          name: "Max Errors",
          description:
            "The number of errors that are allowed before the system stops running the automation on additional targets.",
          type: "string",
          required: false,
        },
        TargetLocations: {
          name: "Target Locations",
          description:
            "A location is a combination of Amazon Web Services Regions and/or Amazon Web Services accounts where you want to run the automation.",
          type: {
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
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
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
          required: false,
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
        AlarmConfiguration: {
          name: "Alarm Configuration",
          description:
            "The CloudWatch alarm you want to apply to your automation.",
          type: {
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
          required: false,
        },
        TargetLocationsURL: {
          name: "Target Locations URL",
          description:
            "Specify a publicly accessible URL for a file that contains the TargetLocations body.",
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

        const command = new StartAutomationExecutionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Automation Execution Result",
      description: "Result from StartAutomationExecution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AutomationExecutionId: {
            type: "string",
            description:
              "The unique ID of a newly scheduled automation execution.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startAutomationExecution;

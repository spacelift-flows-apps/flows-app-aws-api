import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, CreateAssociationCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createAssociation: AppBlock = {
  name: "Create Association",
  description: `A State Manager association defines the state that you want to maintain on your managed nodes.`,
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
        Name: {
          name: "Name",
          description:
            "The name of the SSM Command document or Automation runbook that contains the configuration information for the managed node.",
          type: "string",
          required: true,
        },
        DocumentVersion: {
          name: "Document Version",
          description:
            "The document version you want to associate with the targets.",
          type: "string",
          required: false,
        },
        InstanceId: {
          name: "Instance Id",
          description: "The managed node ID.",
          type: "string",
          required: false,
        },
        Parameters: {
          name: "Parameters",
          description:
            "The parameters for the runtime configuration of the document.",
          type: {
            type: "object",
            additionalProperties: {
              type: "array",
            },
          },
          required: false,
        },
        Targets: {
          name: "Targets",
          description: "The targets for the association.",
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
        ScheduleExpression: {
          name: "Schedule Expression",
          description:
            "A cron expression when the association will be applied to the targets.",
          type: "string",
          required: false,
        },
        OutputLocation: {
          name: "Output Location",
          description:
            "An Amazon Simple Storage Service (Amazon S3) bucket where you want to store the output details of the request.",
          type: {
            type: "object",
            properties: {
              S3Location: {
                type: "object",
                properties: {
                  OutputS3Region: {
                    type: "string",
                  },
                  OutputS3BucketName: {
                    type: "string",
                  },
                  OutputS3KeyPrefix: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        AssociationName: {
          name: "Association Name",
          description: "Specify a descriptive name for the association.",
          type: "string",
          required: false,
        },
        AutomationTargetParameterName: {
          name: "Automation Target Parameter Name",
          description:
            "Choose the parameter that will define how your automation will branch out.",
          type: "string",
          required: false,
        },
        MaxErrors: {
          name: "Max Errors",
          description:
            "The number of errors that are allowed before the system stops sending requests to run the association on additional targets.",
          type: "string",
          required: false,
        },
        MaxConcurrency: {
          name: "Max Concurrency",
          description:
            "The maximum number of targets allowed to run the association at the same time.",
          type: "string",
          required: false,
        },
        ComplianceSeverity: {
          name: "Compliance Severity",
          description: "The severity level to assign to the association.",
          type: "string",
          required: false,
        },
        SyncCompliance: {
          name: "Sync Compliance",
          description: "The mode for generating association compliance.",
          type: "string",
          required: false,
        },
        ApplyOnlyAtCronInterval: {
          name: "Apply Only At Cron Interval",
          description:
            "By default, when you create a new association, the system runs it immediately after it is created and then according to the schedule you specified and when target changes are detected.",
          type: "boolean",
          required: false,
        },
        CalendarNames: {
          name: "Calendar Names",
          description:
            "The names of Amazon Resource Names (ARNs) of the Change Calendar type documents you want to gate your associations under.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        TargetLocations: {
          name: "Target Locations",
          description:
            "A location is a combination of Amazon Web Services Regions and Amazon Web Services accounts where you want to run the association.",
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
        ScheduleOffset: {
          name: "Schedule Offset",
          description:
            "Number of days to wait after the scheduled day to run an association.",
          type: "number",
          required: false,
        },
        Duration: {
          name: "Duration",
          description:
            "The number of hours the association can run before it is canceled.",
          type: "number",
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
        Tags: {
          name: "Tags",
          description:
            "Adds or overwrites one or more tags for a State Manager association.",
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
            "The details for the CloudWatch alarm you want to apply to an automation or command.",
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

        const command = new CreateAssociationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Association Result",
      description: "Result from CreateAssociation operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AssociationDescription: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              InstanceId: {
                type: "string",
              },
              AssociationVersion: {
                type: "string",
              },
              Date: {
                type: "string",
              },
              LastUpdateAssociationDate: {
                type: "string",
              },
              Status: {
                type: "object",
                properties: {
                  Date: {
                    type: "string",
                  },
                  Name: {
                    type: "string",
                  },
                  Message: {
                    type: "string",
                  },
                  AdditionalInfo: {
                    type: "string",
                  },
                },
                required: ["Date", "Name", "Message"],
                additionalProperties: false,
              },
              Overview: {
                type: "object",
                properties: {
                  Status: {
                    type: "string",
                  },
                  DetailedStatus: {
                    type: "string",
                  },
                  AssociationStatusAggregatedCount: {
                    type: "object",
                    additionalProperties: {
                      type: "number",
                    },
                  },
                },
                additionalProperties: false,
              },
              DocumentVersion: {
                type: "string",
              },
              AutomationTargetParameterName: {
                type: "string",
              },
              Parameters: {
                type: "object",
                additionalProperties: {
                  type: "array",
                },
              },
              AssociationId: {
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
              ScheduleExpression: {
                type: "string",
              },
              OutputLocation: {
                type: "object",
                properties: {
                  S3Location: {
                    type: "object",
                    properties: {
                      OutputS3Region: {
                        type: "string",
                      },
                      OutputS3BucketName: {
                        type: "string",
                      },
                      OutputS3KeyPrefix: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              LastExecutionDate: {
                type: "string",
              },
              LastSuccessfulExecutionDate: {
                type: "string",
              },
              AssociationName: {
                type: "string",
              },
              MaxErrors: {
                type: "string",
              },
              MaxConcurrency: {
                type: "string",
              },
              ComplianceSeverity: {
                type: "string",
              },
              SyncCompliance: {
                type: "string",
              },
              ApplyOnlyAtCronInterval: {
                type: "boolean",
              },
              CalendarNames: {
                type: "array",
                items: {
                  type: "string",
                },
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
              ScheduleOffset: {
                type: "number",
              },
              Duration: {
                type: "number",
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
            },
            additionalProperties: false,
            description: "Information about the association.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createAssociation;

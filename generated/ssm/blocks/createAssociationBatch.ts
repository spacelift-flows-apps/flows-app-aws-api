import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, CreateAssociationBatchCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createAssociationBatch: AppBlock = {
  name: "Create Association Batch",
  description: `Associates the specified Amazon Web Services Systems Manager document (SSM document) with the specified managed nodes or targets.`,
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
        Entries: {
          name: "Entries",
          description: "One or more associations.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                InstanceId: {
                  type: "string",
                },
                Parameters: {
                  type: "object",
                  additionalProperties: {
                    type: "array",
                  },
                },
                AutomationTargetParameterName: {
                  type: "string",
                },
                DocumentVersion: {
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
                  enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNSPECIFIED"],
                },
                SyncCompliance: {
                  type: "string",
                  enum: ["AUTO", "MANUAL"],
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
                          Name: {},
                        },
                        required: ["Name"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["Alarms"],
                  additionalProperties: false,
                },
              },
              required: ["Name"],
              additionalProperties: false,
            },
          },
          required: true,
        },
        AssociationDispatchAssumeRole: {
          name: "Association Dispatch Assume Role",
          description:
            "A role used by association to take actions on your behalf.",
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

        const command = new CreateAssociationBatchCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Association Batch Result",
      description: "Result from CreateAssociationBatch operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Successful: {
            type: "array",
            items: {
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
                      enum: ["Pending", "Success", "Failed"],
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
                        items: {},
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
                  enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNSPECIFIED"],
                },
                SyncCompliance: {
                  type: "string",
                  enum: ["AUTO", "MANUAL"],
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
                          Name: {},
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
                AssociationDispatchAssumeRole: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the associations that succeeded.",
          },
          Failed: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Entry: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                    InstanceId: {
                      type: "string",
                    },
                    Parameters: {
                      type: "object",
                      additionalProperties: {
                        type: "array",
                      },
                    },
                    AutomationTargetParameterName: {
                      type: "string",
                    },
                    DocumentVersion: {
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
                    ScheduleExpression: {
                      type: "string",
                    },
                    OutputLocation: {
                      type: "object",
                      properties: {
                        S3Location: {
                          type: "object",
                          properties: {
                            OutputS3Region: {},
                            OutputS3BucketName: {},
                            OutputS3KeyPrefix: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      additionalProperties: false,
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
                      enum: [
                        "CRITICAL",
                        "HIGH",
                        "MEDIUM",
                        "LOW",
                        "UNSPECIFIED",
                      ],
                    },
                    SyncCompliance: {
                      type: "string",
                      enum: ["AUTO", "MANUAL"],
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
                          type: "object",
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
                          items: {},
                        },
                      },
                      required: ["Alarms"],
                      additionalProperties: false,
                    },
                  },
                  required: ["Name"],
                  additionalProperties: false,
                },
                Message: {
                  type: "string",
                },
                Fault: {
                  type: "string",
                  enum: ["Client", "Server", "Unknown"],
                },
              },
              additionalProperties: false,
            },
            description: "Information about the associations that failed.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createAssociationBatch;

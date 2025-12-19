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
                          type: "object",
                          additionalProperties: true,
                        },
                        OutputS3BucketName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        OutputS3KeyPrefix: {
                          type: "object",
                          additionalProperties: true,
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
                      items: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
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
                          type: "object",
                          additionalProperties: true,
                        },
                        OutputS3BucketName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        OutputS3KeyPrefix: {
                          type: "object",
                          additionalProperties: true,
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
                        type: "object",
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
                        additionalProperties: true,
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
                          additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    TargetLocations: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
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
                        additionalProperties: true,
                      },
                    },
                    AlarmConfiguration: {
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
                  },
                  required: ["Name"],
                  additionalProperties: false,
                },
                Message: {
                  type: "string",
                },
                Fault: {
                  type: "string",
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

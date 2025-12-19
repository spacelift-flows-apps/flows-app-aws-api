import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  UpdateMaintenanceWindowTaskCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateMaintenanceWindowTask: AppBlock = {
  name: "Update Maintenance Window Task",
  description: `Modifies a task assigned to a maintenance window.`,
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
        WindowId: {
          name: "Window Id",
          description:
            "The maintenance window ID that contains the task to modify.",
          type: "string",
          required: true,
        },
        WindowTaskId: {
          name: "Window Task Id",
          description: "The task ID to modify.",
          type: "string",
          required: true,
        },
        Targets: {
          name: "Targets",
          description: "The targets (either managed nodes or tags) to modify.",
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
        TaskArn: {
          name: "Task Arn",
          description: "The task ARN to modify.",
          type: "string",
          required: false,
        },
        ServiceRoleArn: {
          name: "Service Role Arn",
          description:
            "The Amazon Resource Name (ARN) of the IAM service role for Amazon Web Services Systems Manager to assume when running a maintenance window task.",
          type: "string",
          required: false,
        },
        TaskParameters: {
          name: "Task Parameters",
          description: "The parameters to modify.",
          type: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
          },
          required: false,
        },
        TaskInvocationParameters: {
          name: "Task Invocation Parameters",
          description:
            "The parameters that the task should use during execution.",
          type: {
            type: "object",
            properties: {
              RunCommand: {
                type: "object",
                properties: {
                  Comment: {
                    type: "string",
                  },
                  CloudWatchOutputConfig: {
                    type: "object",
                    properties: {
                      CloudWatchLogGroupName: {
                        type: "string",
                      },
                      CloudWatchOutputEnabled: {
                        type: "boolean",
                      },
                    },
                    additionalProperties: false,
                  },
                  DocumentHash: {
                    type: "string",
                  },
                  DocumentHashType: {
                    type: "string",
                  },
                  DocumentVersion: {
                    type: "string",
                  },
                  NotificationConfig: {
                    type: "object",
                    properties: {
                      NotificationArn: {
                        type: "string",
                      },
                      NotificationEvents: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      NotificationType: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                  OutputS3BucketName: {
                    type: "string",
                  },
                  OutputS3KeyPrefix: {
                    type: "string",
                  },
                  Parameters: {
                    type: "object",
                    additionalProperties: {
                      type: "array",
                    },
                  },
                  ServiceRoleArn: {
                    type: "string",
                  },
                  TimeoutSeconds: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              Automation: {
                type: "object",
                properties: {
                  DocumentVersion: {
                    type: "string",
                  },
                  Parameters: {
                    type: "object",
                    additionalProperties: {
                      type: "array",
                    },
                  },
                },
                additionalProperties: false,
              },
              StepFunctions: {
                type: "object",
                properties: {
                  Input: {
                    type: "string",
                  },
                  Name: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              Lambda: {
                type: "object",
                properties: {
                  ClientContext: {
                    type: "string",
                  },
                  Qualifier: {
                    type: "string",
                  },
                  Payload: {
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
        Priority: {
          name: "Priority",
          description: "The new task priority to specify.",
          type: "number",
          required: false,
        },
        MaxConcurrency: {
          name: "Max Concurrency",
          description: "The new MaxConcurrency value you want to specify.",
          type: "string",
          required: false,
        },
        MaxErrors: {
          name: "Max Errors",
          description: "The new MaxErrors value to specify.",
          type: "string",
          required: false,
        },
        LoggingInfo: {
          name: "Logging Info",
          description: "The new logging location in Amazon S3 to specify.",
          type: {
            type: "object",
            properties: {
              S3BucketName: {
                type: "string",
              },
              S3KeyPrefix: {
                type: "string",
              },
              S3Region: {
                type: "string",
              },
            },
            required: ["S3BucketName", "S3Region"],
            additionalProperties: false,
          },
          required: false,
        },
        Name: {
          name: "Name",
          description: "The new task name to specify.",
          type: "string",
          required: false,
        },
        Description: {
          name: "Description",
          description: "The new task description to specify.",
          type: "string",
          required: false,
        },
        Replace: {
          name: "Replace",
          description:
            "If True, then all fields that are required by the RegisterTaskWithMaintenanceWindow operation are also required for this API request.",
          type: "boolean",
          required: false,
        },
        CutoffBehavior: {
          name: "Cutoff Behavior",
          description:
            "Indicates whether tasks should continue to run after the cutoff time specified in the maintenance windows is reached.",
          type: "string",
          required: false,
        },
        AlarmConfiguration: {
          name: "Alarm Configuration",
          description:
            "The CloudWatch alarm you want to apply to your maintenance window task.",
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

        const command = new UpdateMaintenanceWindowTaskCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Maintenance Window Task Result",
      description: "Result from UpdateMaintenanceWindowTask operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          WindowId: {
            type: "string",
            description: "The ID of the maintenance window that was updated.",
          },
          WindowTaskId: {
            type: "string",
            description:
              "The task ID of the maintenance window that was updated.",
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
            description: "The updated target values.",
          },
          TaskArn: {
            type: "string",
            description: "The updated task ARN value.",
          },
          ServiceRoleArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the IAM service role for Amazon Web Services Systems Manager to assume when running a maintenance window task.",
          },
          TaskParameters: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
            description: "The updated parameter values.",
          },
          TaskInvocationParameters: {
            type: "object",
            properties: {
              RunCommand: {
                type: "object",
                properties: {
                  Comment: {
                    type: "string",
                  },
                  CloudWatchOutputConfig: {
                    type: "object",
                    properties: {
                      CloudWatchLogGroupName: {
                        type: "string",
                      },
                      CloudWatchOutputEnabled: {
                        type: "boolean",
                      },
                    },
                    additionalProperties: false,
                  },
                  DocumentHash: {
                    type: "string",
                  },
                  DocumentHashType: {
                    type: "string",
                  },
                  DocumentVersion: {
                    type: "string",
                  },
                  NotificationConfig: {
                    type: "object",
                    properties: {
                      NotificationArn: {
                        type: "string",
                      },
                      NotificationEvents: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      NotificationType: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                  OutputS3BucketName: {
                    type: "string",
                  },
                  OutputS3KeyPrefix: {
                    type: "string",
                  },
                  Parameters: {
                    type: "object",
                    additionalProperties: {
                      type: "array",
                    },
                  },
                  ServiceRoleArn: {
                    type: "string",
                  },
                  TimeoutSeconds: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              Automation: {
                type: "object",
                properties: {
                  DocumentVersion: {
                    type: "string",
                  },
                  Parameters: {
                    type: "object",
                    additionalProperties: {
                      type: "array",
                    },
                  },
                },
                additionalProperties: false,
              },
              StepFunctions: {
                type: "object",
                properties: {
                  Input: {
                    type: "string",
                  },
                  Name: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              Lambda: {
                type: "object",
                properties: {
                  ClientContext: {
                    type: "string",
                  },
                  Qualifier: {
                    type: "string",
                  },
                  Payload: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "The updated parameter values.",
          },
          Priority: {
            type: "number",
            description: "The updated priority value.",
          },
          MaxConcurrency: {
            type: "string",
            description: "The updated MaxConcurrency value.",
          },
          MaxErrors: {
            type: "string",
            description: "The updated MaxErrors value.",
          },
          LoggingInfo: {
            type: "object",
            properties: {
              S3BucketName: {
                type: "string",
              },
              S3KeyPrefix: {
                type: "string",
              },
              S3Region: {
                type: "string",
              },
            },
            required: ["S3BucketName", "S3Region"],
            additionalProperties: false,
            description: "The updated logging information in Amazon S3.",
          },
          Name: {
            type: "string",
            description: "The updated task name.",
          },
          Description: {
            type: "string",
            description: "The updated task description.",
          },
          CutoffBehavior: {
            type: "string",
            description:
              "The specification for whether tasks should continue to run after the cutoff time specified in the maintenance windows is reached.",
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
            description:
              "The details for the CloudWatch alarm you applied to your maintenance window task.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateMaintenanceWindowTask;

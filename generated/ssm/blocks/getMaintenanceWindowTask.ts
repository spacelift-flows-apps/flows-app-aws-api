import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  GetMaintenanceWindowTaskCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getMaintenanceWindowTask: AppBlock = {
  name: "Get Maintenance Window Task",
  description: `Retrieves the details of a maintenance window task.`,
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
            "The maintenance window ID that includes the task to retrieve.",
          type: "string",
          required: true,
        },
        WindowTaskId: {
          name: "Window Task Id",
          description: "The maintenance window task ID to retrieve.",
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

        const command = new GetMaintenanceWindowTaskCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Maintenance Window Task Result",
      description: "Result from GetMaintenanceWindowTask operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          WindowId: {
            type: "string",
            description: "The retrieved maintenance window ID.",
          },
          WindowTaskId: {
            type: "string",
            description: "The retrieved maintenance window task ID.",
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
            description: "The targets where the task should run.",
          },
          TaskArn: {
            type: "string",
            description: "The resource that the task used during execution.",
          },
          ServiceRoleArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the IAM service role for Amazon Web Services Systems Manager to assume when running a maintenance window task.",
          },
          TaskType: {
            type: "string",
            description: "The type of task to run.",
          },
          TaskParameters: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
            description: "The parameters to pass to the task when it runs.",
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
            description: "The parameters to pass to the task when it runs.",
          },
          Priority: {
            type: "number",
            description: "The priority of the task when it runs.",
          },
          MaxConcurrency: {
            type: "string",
            description:
              "The maximum number of targets allowed to run this task in parallel.",
          },
          MaxErrors: {
            type: "string",
            description:
              "The maximum number of errors allowed before the task stops being scheduled.",
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
            description:
              "The location in Amazon Simple Storage Service (Amazon S3) where the task results are logged.",
          },
          Name: {
            type: "string",
            description: "The retrieved task name.",
          },
          Description: {
            type: "string",
            description: "The retrieved task description.",
          },
          CutoffBehavior: {
            type: "string",
            description:
              "The action to take on tasks when the maintenance window cutoff time is reached.",
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

export default getMaintenanceWindowTask;

import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, SendCommandCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const sendCommand: AppBlock = {
  name: "Send Command",
  description: `Runs commands on one or more managed nodes.`,
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
        InstanceIds: {
          name: "Instance Ids",
          description:
            "The IDs of the managed nodes where the command should run.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Targets: {
          name: "Targets",
          description:
            "An array of search criteria that targets managed nodes using a Key,Value combination that you specify.",
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
        DocumentName: {
          name: "Document Name",
          description:
            "The name of the Amazon Web Services Systems Manager document (SSM document) to run.",
          type: "string",
          required: true,
        },
        DocumentVersion: {
          name: "Document Version",
          description: "The SSM document version to use in the request.",
          type: "string",
          required: false,
        },
        DocumentHash: {
          name: "Document Hash",
          description:
            "The Sha256 or Sha1 hash created by the system when the document was created.",
          type: "string",
          required: false,
        },
        DocumentHashType: {
          name: "Document Hash Type",
          description: "Sha256 or Sha1.",
          type: "string",
          required: false,
        },
        TimeoutSeconds: {
          name: "Timeout Seconds",
          description:
            "If this time is reached and the command hasn't already started running, it won't run.",
          type: "number",
          required: false,
        },
        Comment: {
          name: "Comment",
          description:
            "User-specified information about the command, such as a brief description of what the command should do.",
          type: "string",
          required: false,
        },
        Parameters: {
          name: "Parameters",
          description:
            "The required and optional parameters specified in the document being run.",
          type: {
            type: "object",
            additionalProperties: {
              type: "array",
            },
          },
          required: false,
        },
        OutputS3Region: {
          name: "Output S3Region",
          description: "(Deprecated) You can no longer specify this parameter.",
          type: "string",
          required: false,
        },
        OutputS3BucketName: {
          name: "Output S3Bucket Name",
          description:
            "The name of the S3 bucket where command execution responses should be stored.",
          type: "string",
          required: false,
        },
        OutputS3KeyPrefix: {
          name: "Output S3Key Prefix",
          description:
            "The directory structure within the S3 bucket where the responses should be stored.",
          type: "string",
          required: false,
        },
        MaxConcurrency: {
          name: "Max Concurrency",
          description:
            "(Optional) The maximum number of managed nodes that are allowed to run the command at the same time.",
          type: "string",
          required: false,
        },
        MaxErrors: {
          name: "Max Errors",
          description:
            "The maximum number of errors allowed without the command failing.",
          type: "string",
          required: false,
        },
        ServiceRoleArn: {
          name: "Service Role Arn",
          description:
            "The ARN of the Identity and Access Management (IAM) service role to use to publish Amazon Simple Notification Service (Amazon SNS) notifications for Run Command commands.",
          type: "string",
          required: false,
        },
        NotificationConfig: {
          name: "Notification Config",
          description: "Configurations for sending notifications.",
          type: {
            type: "object",
            properties: {
              NotificationArn: {
                type: "string",
              },
              NotificationEvents: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              NotificationType: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        CloudWatchOutputConfig: {
          name: "Cloud Watch Output Config",
          description:
            "Enables Amazon Web Services Systems Manager to send Run Command output to Amazon CloudWatch Logs.",
          type: {
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
          required: false,
        },
        AlarmConfiguration: {
          name: "Alarm Configuration",
          description:
            "The CloudWatch alarm you want to apply to your command.",
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
        }

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new SendCommandCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Send Command Result",
      description: "Result from SendCommand operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Command: {
            type: "object",
            properties: {
              CommandId: {
                type: "string",
              },
              DocumentName: {
                type: "string",
              },
              DocumentVersion: {
                type: "string",
              },
              Comment: {
                type: "string",
              },
              ExpiresAfter: {
                type: "string",
              },
              Parameters: {
                type: "object",
                additionalProperties: {
                  type: "array",
                },
              },
              InstanceIds: {
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
              RequestedDateTime: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              StatusDetails: {
                type: "string",
              },
              OutputS3Region: {
                type: "string",
              },
              OutputS3BucketName: {
                type: "string",
              },
              OutputS3KeyPrefix: {
                type: "string",
              },
              MaxConcurrency: {
                type: "string",
              },
              MaxErrors: {
                type: "string",
              },
              TargetCount: {
                type: "number",
              },
              CompletedCount: {
                type: "number",
              },
              ErrorCount: {
                type: "number",
              },
              DeliveryTimedOutCount: {
                type: "number",
              },
              ServiceRole: {
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
                      type: "string",
                    },
                  },
                  NotificationType: {
                    type: "string",
                  },
                },
                additionalProperties: false,
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
              TimeoutSeconds: {
                type: "number",
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
            description: "The request as it was received by Systems Manager.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default sendCommand;

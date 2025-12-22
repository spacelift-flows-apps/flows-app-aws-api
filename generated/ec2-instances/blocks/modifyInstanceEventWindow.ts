import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  ModifyInstanceEventWindowCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyInstanceEventWindow: AppBlock = {
  name: "Modify Instance Event Window",
  description: `Modifies the specified event window.`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        Name: {
          name: "Name",
          description: "The name of the event window.",
          type: "string",
          required: false,
        },
        InstanceEventWindowId: {
          name: "Instance Event Window Id",
          description: "The ID of the event window.",
          type: "string",
          required: true,
        },
        TimeRanges: {
          name: "Time Ranges",
          description: "The time ranges of the event window.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                StartWeekDay: {
                  type: "string",
                },
                StartHour: {
                  type: "number",
                },
                EndWeekDay: {
                  type: "string",
                },
                EndHour: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        CronExpression: {
          name: "Cron Expression",
          description:
            "The cron expression of the event window, for example, * 0-4,20-23 * * 1,5.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyInstanceEventWindowCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Instance Event Window Result",
      description: "Result from ModifyInstanceEventWindow operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceEventWindow: {
            type: "object",
            properties: {
              InstanceEventWindowId: {
                type: "string",
              },
              TimeRanges: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    StartWeekDay: {
                      type: "string",
                    },
                    StartHour: {
                      type: "number",
                    },
                    EndWeekDay: {
                      type: "string",
                    },
                    EndHour: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
              },
              Name: {
                type: "string",
              },
              CronExpression: {
                type: "string",
              },
              AssociationTarget: {
                type: "object",
                properties: {
                  InstanceIds: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  Tags: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Key: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Value: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  DedicatedHostIds: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                additionalProperties: false,
              },
              State: {
                type: "string",
              },
              Tags: {
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
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description: "Information about the event window.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyInstanceEventWindow;

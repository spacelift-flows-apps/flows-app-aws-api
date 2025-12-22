import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  PutCompositeAlarmCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putCompositeAlarm: AppBlock = {
  name: "Put Composite Alarm",
  description: `Creates or updates a composite alarm.`,
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
        ActionsEnabled: {
          name: "Actions Enabled",
          description:
            "Indicates whether actions should be executed during any changes to the alarm state of the composite alarm.",
          type: "boolean",
          required: false,
        },
        AlarmActions: {
          name: "Alarm Actions",
          description:
            "The actions to execute when this alarm transitions to the ALARM state from any other state.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AlarmDescription: {
          name: "Alarm Description",
          description: "The description for the composite alarm.",
          type: "string",
          required: false,
        },
        AlarmName: {
          name: "Alarm Name",
          description: "The name for the composite alarm.",
          type: "string",
          required: true,
        },
        AlarmRule: {
          name: "Alarm Rule",
          description:
            "An expression that specifies which other alarms are to be evaluated to determine this composite alarm's state.",
          type: "string",
          required: true,
        },
        InsufficientDataActions: {
          name: "Insufficient Data Actions",
          description:
            "The actions to execute when this alarm transitions to the INSUFFICIENT_DATA state from any other state.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        OKActions: {
          name: "OK Actions",
          description:
            "The actions to execute when this alarm transitions to an OK state from any other state.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "A list of key-value pairs to associate with the alarm.",
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
        ActionsSuppressor: {
          name: "Actions Suppressor",
          description:
            "Actions will be suppressed if the suppressor alarm is in the ALARM state.",
          type: "string",
          required: false,
        },
        ActionsSuppressorWaitPeriod: {
          name: "Actions Suppressor Wait Period",
          description:
            "The maximum time in seconds that the composite alarm waits for the suppressor alarm to go into the ALARM state.",
          type: "number",
          required: false,
        },
        ActionsSuppressorExtensionPeriod: {
          name: "Actions Suppressor Extension Period",
          description:
            "The maximum time in seconds that the composite alarm waits after suppressor alarm goes out of the ALARM state.",
          type: "number",
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

        const client = new CloudWatchClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutCompositeAlarmCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Composite Alarm Result",
      description: "Result from PutCompositeAlarm operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default putCompositeAlarm;

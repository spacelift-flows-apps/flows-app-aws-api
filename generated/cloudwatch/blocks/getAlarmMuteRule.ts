import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  GetAlarmMuteRuleCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getAlarmMuteRule: AppBlock = {
  name: "Get Alarm Mute Rule",
  description: `Retrieves details for a specific alarm mute rule.`,
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
        AlarmMuteRuleName: {
          name: "Alarm Mute Rule Name",
          description: "The name of the alarm mute rule to retrieve.",
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

        const client = new CloudWatchClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetAlarmMuteRuleCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Alarm Mute Rule Result",
      description: "Result from GetAlarmMuteRule operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Name: {
            type: "string",
            description: "The name of the alarm mute rule.",
          },
          AlarmMuteRuleArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the alarm mute rule.",
          },
          Description: {
            type: "string",
            description: "The description of the alarm mute rule.",
          },
          Rule: {
            type: "object",
            properties: {
              Schedule: {
                type: "object",
                properties: {
                  Expression: {
                    type: "string",
                  },
                  Duration: {
                    type: "string",
                  },
                  Timezone: {
                    type: "string",
                  },
                },
                required: ["Expression", "Duration"],
                additionalProperties: false,
              },
            },
            required: ["Schedule"],
            additionalProperties: false,
            description:
              "The configuration that defines when and how long alarms are muted.",
          },
          MuteTargets: {
            type: "object",
            properties: {
              AlarmNames: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            required: ["AlarmNames"],
            additionalProperties: false,
            description: "Specifies which alarms this rule applies to.",
          },
          StartDate: {
            type: "string",
            description: "The date and time when the mute rule becomes active.",
          },
          ExpireDate: {
            type: "string",
            description:
              "The date and time when the mute rule expires and is no longer evaluated.",
          },
          Status: {
            type: "string",
            description: "The current status of the alarm mute rule.",
          },
          LastUpdatedTimestamp: {
            type: "string",
            description:
              "The date and time when the mute rule was last updated.",
          },
          MuteType: {
            type: "string",
            description:
              "Indicates whether the mute rule is one-time or recurring.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getAlarmMuteRule;

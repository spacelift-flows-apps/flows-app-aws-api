import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  PutAlarmMuteRuleCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const putAlarmMuteRule: AppBlock = {
  name: "Put Alarm Mute Rule",
  description: `Creates or updates an alarm mute rule.`,
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
          description: "The name of the alarm mute rule.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description:
            "A description of the alarm mute rule that helps you identify its purpose.",
          type: "string",
          required: false,
        },
        Rule: {
          name: "Rule",
          description:
            "The configuration that defines when and how long alarms should be muted.",
          type: {
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
          },
          required: true,
        },
        MuteTargets: {
          name: "Mute Targets",
          description: "Specifies which alarms this rule applies to.",
          type: {
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
          },
          required: false,
        },
        Tags: {
          name: "Tags",
          description:
            "A list of key-value pairs to associate with the alarm mute rule.",
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
        StartDate: {
          name: "Start Date",
          description:
            "The date and time after which the mute rule takes effect, specified as a timestamp in ISO 8601 format (for example, 2026-04-15T08:00:00Z).",
          type: "string",
          required: false,
        },
        ExpireDate: {
          name: "Expire Date",
          description:
            "The date and time when the mute rule expires and is no longer evaluated, specified as a timestamp in ISO 8601 format (for example, 2026-12-31T23:59:59Z).",
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

        const client = new CloudWatchClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutAlarmMuteRuleCommand(
          convertTimestamps(
            commandInput,
            new Set(["StartDate", "ExpireDate"]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Alarm Mute Rule Result",
      description: "Result from PutAlarmMuteRule operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default putAlarmMuteRule;

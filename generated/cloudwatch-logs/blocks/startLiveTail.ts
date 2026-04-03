import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  StartLiveTailCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startLiveTail: AppBlock = {
  name: "Start Live Tail",
  description: `Starts a Live Tail streaming session for one or more log groups.`,
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
        logGroupIdentifiers: {
          name: "log Group Identifiers",
          description:
            "An array where each item in the array is a log group to include in the Live Tail session.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        logStreamNames: {
          name: "log Stream Names",
          description:
            "If you specify this parameter, then only log events in the log streams that you specify here are included in the Live Tail session.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        logStreamNamePrefixes: {
          name: "log Stream Name Prefixes",
          description:
            "If you specify this parameter, then only log events in the log streams that have names that start with the prefixes that you specify here are included in the Live Tail session.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        logEventFilterPattern: {
          name: "log Event Filter Pattern",
          description:
            "An optional pattern to use to filter the results to include only log events that match the pattern.",
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new StartLiveTailCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Live Tail Result",
      description: "Result from StartLiveTail operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          responseStream: {
            type: "string",
            description:
              "An object that includes the stream returned by your request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startLiveTail;

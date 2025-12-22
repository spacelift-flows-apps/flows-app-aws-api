import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EventBridgeClient,
  StartReplayCommand,
} from "@aws-sdk/client-eventbridge";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startReplay: AppBlock = {
  name: "Start Replay",
  description: `Starts the specified replay.`,
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
        ReplayName: {
          name: "Replay Name",
          description: "The name of the replay to start.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "A description for the replay to start.",
          type: "string",
          required: false,
        },
        EventSourceArn: {
          name: "Event Source Arn",
          description: "The ARN of the archive to replay events from.",
          type: "string",
          required: true,
        },
        EventStartTime: {
          name: "Event Start Time",
          description: "A time stamp for the time to start replaying events.",
          type: "string",
          required: true,
        },
        EventEndTime: {
          name: "Event End Time",
          description: "A time stamp for the time to stop replaying events.",
          type: "string",
          required: true,
        },
        Destination: {
          name: "Destination",
          description:
            "A ReplayDestination object that includes details about the destination for the replay.",
          type: {
            type: "object",
            properties: {
              Arn: {
                type: "string",
              },
              FilterArns: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            required: ["Arn"],
            additionalProperties: false,
          },
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

        const client = new EventBridgeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new StartReplayCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Replay Result",
      description: "Result from StartReplay operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ReplayArn: {
            type: "string",
            description: "The ARN of the replay.",
          },
          State: {
            type: "string",
            description: "The state of the replay.",
          },
          StateReason: {
            type: "string",
            description: "The reason that the replay is in the state.",
          },
          ReplayStartTime: {
            type: "string",
            description: "The time at which the replay started.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startReplay;

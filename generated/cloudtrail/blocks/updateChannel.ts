import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  UpdateChannelCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateChannel: AppBlock = {
  name: "Update Channel",
  description: `Updates a channel specified by a required channel ARN or UUID.`,
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
        Channel: {
          name: "Channel",
          description:
            "The ARN or ID (the ARN suffix) of the channel that you want to update.",
          type: "string",
          required: true,
        },
        Destinations: {
          name: "Destinations",
          description:
            "The ARNs of event data stores that you want to log events arriving through the channel.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Type: {
                  type: "string",
                },
                Location: {
                  type: "string",
                },
              },
              required: ["Type", "Location"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Name: {
          name: "Name",
          description: "Changes the name of the channel.",
          type: "string",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateChannelCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Channel Result",
      description: "Result from UpdateChannel operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ChannelArn: {
            type: "string",
            description: "The ARN of the channel that was updated.",
          },
          Name: {
            type: "string",
            description: "The name of the channel that was updated.",
          },
          Source: {
            type: "string",
            description: "The event source of the channel that was updated.",
          },
          Destinations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Type: {
                  type: "string",
                },
                Location: {
                  type: "string",
                },
              },
              required: ["Type", "Location"],
              additionalProperties: false,
            },
            description:
              "The event data stores that log events arriving through the channel.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateChannel;

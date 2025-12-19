import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  CreateChannelCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createChannel: AppBlock = {
  name: "Create Channel",
  description: `Creates a channel for CloudTrail to ingest events from a partner or external source.`,
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
          description: "The name of the channel.",
          type: "string",
          required: true,
        },
        Source: {
          name: "Source",
          description: "The name of the partner or external event source.",
          type: "string",
          required: true,
        },
        Destinations: {
          name: "Destinations",
          description:
            "One or more event data stores to which events arriving through a channel will be logged.",
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
          required: true,
        },
        Tags: {
          name: "Tags",
          description: "A list of tags.",
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
              required: ["Key"],
              additionalProperties: false,
            },
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateChannelCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Channel Result",
      description: "Result from CreateChannel operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ChannelArn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the new channel.",
          },
          Name: {
            type: "string",
            description: "The name of the new channel.",
          },
          Source: {
            type: "string",
            description: "The partner or external event source name.",
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
              "The event data stores that log the events arriving through the channel.",
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
              required: ["Key"],
              additionalProperties: false,
            },
            description: "A list of tags.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createChannel;

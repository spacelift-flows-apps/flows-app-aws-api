import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EventBridgeClient,
  CreateEventBusCommand,
} from "@aws-sdk/client-eventbridge";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createEventBus: AppBlock = {
  name: "Create Event Bus",
  description: `Creates a new event bus within your account.`,
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
          description: "The name of the new event bus.",
          type: "string",
          required: true,
        },
        EventSourceName: {
          name: "Event Source Name",
          description:
            "If you are creating a partner event bus, this specifies the partner event source that the new event bus will be matched with.",
          type: "string",
          required: false,
        },
        Description: {
          name: "Description",
          description: "The event bus description.",
          type: "string",
          required: false,
        },
        KmsKeyIdentifier: {
          name: "Kms Key Identifier",
          description:
            "The identifier of the KMS customer managed key for EventBridge to use, if you choose to use a customer managed key to encrypt events on this event bus.",
          type: "string",
          required: false,
        },
        DeadLetterConfig: {
          name: "Dead Letter Config",
          description:
            "Configuration details of the Amazon SQS queue for EventBridge to use as a dead-letter queue (DLQ).",
          type: {
            type: "object",
            properties: {
              Arn: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        LogConfig: {
          name: "Log Config",
          description: "The logging configuration settings for the event bus.",
          type: {
            type: "object",
            properties: {
              IncludeDetail: {
                type: "string",
              },
              Level: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "Tags to associate with the event bus.",
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

        const client = new EventBridgeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateEventBusCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Event Bus Result",
      description: "Result from CreateEventBus operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          EventBusArn: {
            type: "string",
            description: "The ARN of the new event bus.",
          },
          Description: {
            type: "string",
            description: "The event bus description.",
          },
          KmsKeyIdentifier: {
            type: "string",
            description:
              "The identifier of the KMS customer managed key for EventBridge to use to encrypt events on this event bus, if one has been specified.",
          },
          DeadLetterConfig: {
            type: "object",
            properties: {
              Arn: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Configuration details of the Amazon SQS queue for EventBridge to use as a dead-letter queue (DLQ).",
          },
          LogConfig: {
            type: "object",
            properties: {
              IncludeDetail: {
                type: "string",
              },
              Level: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The logging configuration settings for the event bus.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createEventBus;

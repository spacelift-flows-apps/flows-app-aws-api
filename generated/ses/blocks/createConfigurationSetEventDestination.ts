import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SESClient,
  CreateConfigurationSetEventDestinationCommand,
} from "@aws-sdk/client-ses";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createConfigurationSetEventDestination: AppBlock = {
  name: "Create Configuration Set Event Destination",
  description: `Creates a configuration set event destination.`,
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
        ConfigurationSetName: {
          name: "Configuration Set Name",
          description:
            "The name of the configuration set that the event destination should be associated with.",
          type: "string",
          required: true,
        },
        EventDestination: {
          name: "Event Destination",
          description:
            "An object that describes the Amazon Web Services service that email sending event where information is published.",
          type: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              Enabled: {
                type: "boolean",
              },
              MatchingEventTypes: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              KinesisFirehoseDestination: {
                type: "object",
                properties: {
                  IAMRoleARN: {
                    type: "string",
                  },
                  DeliveryStreamARN: {
                    type: "string",
                  },
                },
                required: ["IAMRoleARN", "DeliveryStreamARN"],
                additionalProperties: false,
              },
              CloudWatchDestination: {
                type: "object",
                properties: {
                  DimensionConfigurations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        DimensionName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DimensionValueSource: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DefaultDimensionValue: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: [
                        "DimensionName",
                        "DimensionValueSource",
                        "DefaultDimensionValue",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["DimensionConfigurations"],
                additionalProperties: false,
              },
              SNSDestination: {
                type: "object",
                properties: {
                  TopicARN: {
                    type: "string",
                  },
                },
                required: ["TopicARN"],
                additionalProperties: false,
              },
            },
            required: ["Name", "MatchingEventTypes"],
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

        const client = new SESClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateConfigurationSetEventDestinationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Configuration Set Event Destination Result",
      description:
        "Result from CreateConfigurationSetEventDestination operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default createConfigurationSetEventDestination;

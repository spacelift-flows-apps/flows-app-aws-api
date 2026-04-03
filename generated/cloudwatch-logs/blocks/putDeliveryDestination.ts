import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  PutDeliveryDestinationCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putDeliveryDestination: AppBlock = {
  name: "Put Delivery Destination",
  description: `Creates or updates a logical delivery destination.`,
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
        name: {
          name: "name",
          description: "A name for this delivery destination.",
          type: "string",
          required: true,
        },
        outputFormat: {
          name: "output Format",
          description:
            "The format for the logs that this delivery destination will receive.",
          type: "string",
          required: false,
        },
        deliveryDestinationConfiguration: {
          name: "delivery Destination Configuration",
          description:
            "A structure that contains the ARN of the Amazon Web Services resource that will receive the logs.",
          type: {
            type: "object",
            properties: {
              destinationResourceArn: {
                type: "string",
              },
            },
            required: ["destinationResourceArn"],
            additionalProperties: false,
          },
          required: false,
        },
        deliveryDestinationType: {
          name: "delivery Destination Type",
          description: "The type of delivery destination.",
          type: "string",
          required: false,
        },
        tags: {
          name: "tags",
          description:
            "An optional list of key-value pairs to associate with the resource.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
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

        const command = new PutDeliveryDestinationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Delivery Destination Result",
      description: "Result from PutDeliveryDestination operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          deliveryDestination: {
            type: "object",
            properties: {
              name: {
                type: "string",
              },
              arn: {
                type: "string",
              },
              deliveryDestinationType: {
                type: "string",
              },
              outputFormat: {
                type: "string",
              },
              deliveryDestinationConfiguration: {
                type: "object",
                properties: {
                  destinationResourceArn: {
                    type: "string",
                  },
                },
                required: ["destinationResourceArn"],
                additionalProperties: false,
              },
              tags: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
            description:
              "A structure containing information about the delivery destination that you just created or updated.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putDeliveryDestination;

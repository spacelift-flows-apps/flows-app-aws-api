import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  CreateDeliveryCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createDelivery: AppBlock = {
  name: "Create Delivery",
  description: `Creates a delivery.`,
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
        deliverySourceName: {
          name: "delivery Source Name",
          description:
            "The name of the delivery source to use for this delivery.",
          type: "string",
          required: true,
        },
        deliveryDestinationArn: {
          name: "delivery Destination Arn",
          description:
            "The ARN of the delivery destination to use for this delivery.",
          type: "string",
          required: true,
        },
        recordFields: {
          name: "record Fields",
          description:
            "The list of record fields to be delivered to the destination, in order.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        fieldDelimiter: {
          name: "field Delimiter",
          description:
            "The field delimiter to use between record fields when the final output format of a delivery is in Plain, W3C, or Raw format.",
          type: "string",
          required: false,
        },
        s3DeliveryConfiguration: {
          name: "s3Delivery Configuration",
          description:
            "This structure contains parameters that are valid only when the delivery's delivery destination is an S3 bucket.",
          type: {
            type: "object",
            properties: {
              suffixPath: {
                type: "string",
              },
              enableHiveCompatiblePath: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
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

        const command = new CreateDeliveryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Delivery Result",
      description: "Result from CreateDelivery operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          delivery: {
            type: "object",
            properties: {
              id: {
                type: "string",
              },
              arn: {
                type: "string",
              },
              deliverySourceName: {
                type: "string",
              },
              deliveryDestinationArn: {
                type: "string",
              },
              deliveryDestinationType: {
                type: "string",
              },
              recordFields: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              fieldDelimiter: {
                type: "string",
              },
              s3DeliveryConfiguration: {
                type: "object",
                properties: {
                  suffixPath: {
                    type: "string",
                  },
                  enableHiveCompatiblePath: {
                    type: "boolean",
                  },
                },
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
              "A structure that contains information about the delivery that you just created.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createDelivery;

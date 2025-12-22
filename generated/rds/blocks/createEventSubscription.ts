import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, CreateEventSubscriptionCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createEventSubscription: AppBlock = {
  name: "Create Event Subscription",
  description: `Creates an RDS event notification subscription.`,
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
        SubscriptionName: {
          name: "Subscription Name",
          description: "The name of the subscription.",
          type: "string",
          required: true,
        },
        SnsTopicArn: {
          name: "Sns Topic Arn",
          description:
            "The Amazon Resource Name (ARN) of the SNS topic created for event notification.",
          type: "string",
          required: true,
        },
        SourceType: {
          name: "Source Type",
          description: "The type of source that is generating the events.",
          type: "string",
          required: false,
        },
        EventCategories: {
          name: "Event Categories",
          description:
            "A list of event categories for a particular source type (SourceType) that you want to subscribe to.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        SourceIds: {
          name: "Source Ids",
          description:
            "The list of identifiers of the event sources for which events are returned.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Enabled: {
          name: "Enabled",
          description: "Specifies whether to activate the subscription.",
          type: "boolean",
          required: false,
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
              additionalProperties: false,
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateEventSubscriptionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Event Subscription Result",
      description: "Result from CreateEventSubscription operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          EventSubscription: {
            type: "object",
            properties: {
              CustomerAwsId: {
                type: "string",
              },
              CustSubscriptionId: {
                type: "string",
              },
              SnsTopicArn: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              SubscriptionCreationTime: {
                type: "string",
              },
              SourceType: {
                type: "string",
              },
              SourceIdsList: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              EventCategoriesList: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              Enabled: {
                type: "boolean",
              },
              EventSubscriptionArn: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Contains the results of a successful invocation of the DescribeEventSubscriptions action.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createEventSubscription;

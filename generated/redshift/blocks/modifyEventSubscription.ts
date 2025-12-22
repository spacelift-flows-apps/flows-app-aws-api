import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  ModifyEventSubscriptionCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyEventSubscription: AppBlock = {
  name: "Modify Event Subscription",
  description: `Modifies an existing Amazon Redshift event notification subscription.`,
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
          description:
            "The name of the modified Amazon Redshift event notification subscription.",
          type: "string",
          required: true,
        },
        SnsTopicArn: {
          name: "Sns Topic Arn",
          description:
            "The Amazon Resource Name (ARN) of the SNS topic to be used by the event notification subscription.",
          type: "string",
          required: false,
        },
        SourceType: {
          name: "Source Type",
          description: "The type of source that will be generating the events.",
          type: "string",
          required: false,
        },
        SourceIds: {
          name: "Source Ids",
          description:
            "A list of one or more identifiers of Amazon Redshift source objects.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        EventCategories: {
          name: "Event Categories",
          description:
            "Specifies the Amazon Redshift event categories to be published by the event notification subscription.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Severity: {
          name: "Severity",
          description:
            "Specifies the Amazon Redshift event severity to be published by the event notification subscription.",
          type: "string",
          required: false,
        },
        Enabled: {
          name: "Enabled",
          description:
            "A Boolean value indicating if the subscription is enabled.",
          type: "boolean",
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
        }

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyEventSubscriptionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Event Subscription Result",
      description: "Result from ModifyEventSubscription operation",
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
              Severity: {
                type: "string",
              },
              Enabled: {
                type: "boolean",
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
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description: "Describes event subscriptions.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyEventSubscription;

import { AppBlock, events } from "@slflows/sdk/v1";
import { SNSClient, SubscribeCommand } from "@aws-sdk/client-sns";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const subscribe: AppBlock = {
  name: "Subscribe",
  description: `Subscribes an endpoint to an Amazon SNS topic.`,
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
        TopicArn: {
          name: "Topic Arn",
          description: "The ARN of the topic you want to subscribe to.",
          type: "string",
          required: true,
        },
        Protocol: {
          name: "Protocol",
          description: "The protocol that you want to use.",
          type: "string",
          required: true,
        },
        Endpoint: {
          name: "Endpoint",
          description: "The endpoint that you want to receive notifications.",
          type: "string",
          required: false,
        },
        Attributes: {
          name: "Attributes",
          description: "A map of attributes with their corresponding values.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        ReturnSubscriptionArn: {
          name: "Return Subscription Arn",
          description:
            "Sets whether the response from the Subscribe request includes the subscription ARN, even if the subscription is not yet confirmed.",
          type: "boolean",
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

        const client = new SNSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new SubscribeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Subscribe Result",
      description: "Result from Subscribe operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SubscriptionArn: {
            type: "string",
            description:
              'The ARN of the subscription if it is confirmed, or the string "pending confirmation" if the subscription requires confirmation.',
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default subscribe;

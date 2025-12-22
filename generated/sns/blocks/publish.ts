import { AppBlock, events } from "@slflows/sdk/v1";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const publish: AppBlock = {
  name: "Publish",
  description: `Sends a message to an Amazon SNS topic, a text message (SMS message) directly to a phone number, or a message to a mobile platform endpoint (when you specify the TargetArn).`,
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
          description: "The topic you want to publish to.",
          type: "string",
          required: false,
        },
        TargetArn: {
          name: "Target Arn",
          description:
            "If you don't specify a value for the TargetArn parameter, you must specify a value for the PhoneNumber or TopicArn parameters.",
          type: "string",
          required: false,
        },
        PhoneNumber: {
          name: "Phone Number",
          description:
            "The phone number to which you want to deliver an SMS message.",
          type: "string",
          required: false,
        },
        Message: {
          name: "Message",
          description: "The message you want to send.",
          type: "string",
          required: true,
        },
        Subject: {
          name: "Subject",
          description:
            'Optional parameter to be used as the "Subject" line when the message is delivered to email endpoints.',
          type: "string",
          required: false,
        },
        MessageStructure: {
          name: "Message Structure",
          description:
            "Set MessageStructure to json if you want to send a different message for each protocol.",
          type: "string",
          required: false,
        },
        MessageAttributes: {
          name: "Message Attributes",
          description: "Message attributes for Publish action.",
          type: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
          },
          required: false,
        },
        MessageDeduplicationId: {
          name: "Message Deduplication Id",
          description:
            "This parameter applies only to FIFO (first-in-first-out) topics.",
          type: "string",
          required: false,
        },
        MessageGroupId: {
          name: "Message Group Id",
          description:
            "This parameter applies only to FIFO (first-in-first-out) topics.",
          type: "string",
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

        const client = new SNSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PublishCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Publish Result",
      description: "Result from Publish operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          MessageId: {
            type: "string",
            description: "Unique identifier assigned to the published message.",
          },
          SequenceNumber: {
            type: "string",
            description:
              "This response element applies only to FIFO (first-in-first-out) topics.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default publish;

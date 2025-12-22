import { AppBlock, events } from "@slflows/sdk/v1";
import { SQSClient, StartMessageMoveTaskCommand } from "@aws-sdk/client-sqs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startMessageMoveTask: AppBlock = {
  name: "Start Message Move Task",
  description: `Starts an asynchronous task to move messages from a specified source queue to a specified destination queue.`,
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
        SourceArn: {
          name: "Source Arn",
          description:
            "The ARN of the queue that contains the messages to be moved to another queue.",
          type: "string",
          required: true,
        },
        DestinationArn: {
          name: "Destination Arn",
          description: "The ARN of the queue that receives the moved messages.",
          type: "string",
          required: false,
        },
        MaxNumberOfMessagesPerSecond: {
          name: "Max Number Of Messages Per Second",
          description:
            "The number of messages to be moved per second (the message movement rate).",
          type: "number",
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

        const client = new SQSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new StartMessageMoveTaskCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Message Move Task Result",
      description: "Result from StartMessageMoveTask operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TaskHandle: {
            type: "string",
            description:
              "An identifier associated with a message movement task.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startMessageMoveTask;

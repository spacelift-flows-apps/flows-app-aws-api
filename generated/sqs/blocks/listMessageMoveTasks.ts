import { AppBlock, events } from "@slflows/sdk/v1";
import { SQSClient, ListMessageMoveTasksCommand } from "@aws-sdk/client-sqs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listMessageMoveTasks: AppBlock = {
  name: "List Message Move Tasks",
  description: `Gets the most recent message movement tasks (up to 10) under a specific source queue.`,
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
            "The ARN of the queue whose message movement tasks are to be listed.",
          type: "string",
          required: true,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to include in the response.",
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

        const command = new ListMessageMoveTasksCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Message Move Tasks Result",
      description: "Result from ListMessageMoveTasks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                TaskHandle: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                SourceArn: {
                  type: "string",
                },
                DestinationArn: {
                  type: "string",
                },
                MaxNumberOfMessagesPerSecond: {
                  type: "number",
                },
                ApproximateNumberOfMessagesMoved: {
                  type: "number",
                },
                ApproximateNumberOfMessagesToMove: {
                  type: "number",
                },
                FailureReason: {
                  type: "string",
                },
                StartedTimestamp: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of message movement tasks and their attributes.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listMessageMoveTasks;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SQSClient,
  ListDeadLetterSourceQueuesCommand,
} from "@aws-sdk/client-sqs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listDeadLetterSourceQueues: AppBlock = {
  name: "List Dead Letter Source Queues",
  description: `Returns a list of your queues that have the RedrivePolicy queue attribute configured with a dead-letter queue.`,
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
        QueueUrl: {
          name: "Queue Url",
          description: "The URL of a dead-letter queue.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description: "Pagination token to request the next set of results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "Maximum number of results to include in the response.",
          type: "number",
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

        const client = new SQSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListDeadLetterSourceQueuesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Dead Letter Source Queues Result",
      description: "Result from ListDeadLetterSourceQueues operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          queueUrls: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "A list of source queue URLs that have the RedrivePolicy queue attribute configured with a dead-letter queue.",
          },
          NextToken: {
            type: "string",
            description: "Pagination token to include in the next request.",
          },
        },
        required: ["queueUrls"],
      },
    },
  },
};

export default listDeadLetterSourceQueues;

import { AppBlock, events } from "@slflows/sdk/v1";
import { SQSClient, ListQueuesCommand } from "@aws-sdk/client-sqs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listQueues: AppBlock = {
  name: "List Queues",
  description: `Returns a list of your queues in the current region.`,
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
        QueueNamePrefix: {
          name: "Queue Name Prefix",
          description: "A string to use for filtering the list results.",
          type: "string",
          required: false,
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

        const command = new ListQueuesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Queues Result",
      description: "Result from ListQueues operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          QueueUrls: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "A list of queue URLs, up to 1,000 entries, or the value of MaxResults that you sent in the request.",
          },
          NextToken: {
            type: "string",
            description: "Pagination token to include in the next request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listQueues;

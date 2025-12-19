import { AppBlock, events } from "@slflows/sdk/v1";
import { SNSClient, ListTopicsCommand } from "@aws-sdk/client-sns";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listTopics: AppBlock = {
  name: "List Topics",
  description: `Returns a list of the requester's topics.`,
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
        NextToken: {
          name: "Next Token",
          description: "Token returned by the previous ListTopics request.",
          type: "string",
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

        const command = new ListTopicsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Topics Result",
      description: "Result from ListTopics operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Topics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                TopicArn: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of topic ARNs.",
          },
          NextToken: {
            type: "string",
            description: "Token to pass along to the next ListTopics request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listTopics;

import { AppBlock, events } from "@slflows/sdk/v1";
import { SNSClient, CreateTopicCommand } from "@aws-sdk/client-sns";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createTopic: AppBlock = {
  name: "Create Topic",
  description: `Creates a topic to which notifications can be published.`,
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
        Name: {
          name: "Name",
          description: "The name of the topic you want to create.",
          type: "string",
          required: true,
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
        Tags: {
          name: "Tags",
          description: "The list of tags to add to a new topic.",
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
              required: ["Key", "Value"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        DataProtectionPolicy: {
          name: "Data Protection Policy",
          description:
            "The body of the policy document you want to use for this topic.",
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

        const command = new CreateTopicCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Topic Result",
      description: "Result from CreateTopic operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TopicArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) assigned to the created topic.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createTopic;

import { AppBlock, events } from "@slflows/sdk/v1";
import { SQSClient, AddPermissionCommand } from "@aws-sdk/client-sqs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const addPermission: AppBlock = {
  name: "Add Permission",
  description: `Adds a permission to a queue for a specific principal.`,
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
          description:
            "The URL of the Amazon SQS queue to which permissions are added.",
          type: "string",
          required: true,
        },
        Label: {
          name: "Label",
          description:
            "The unique identification of the permission you're setting (for example, AliceSendMessage).",
          type: "string",
          required: true,
        },
        AWSAccountIds: {
          name: "AWS Account Ids",
          description:
            "The Amazon Web Services account numbers of the principals who are to receive permission.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        Actions: {
          name: "Actions",
          description:
            "The action the client wants to allow for the specified principal.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
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

        const command = new AddPermissionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Add Permission Result",
      description: "Result from AddPermission operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default addPermission;

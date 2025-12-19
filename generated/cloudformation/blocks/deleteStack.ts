import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DeleteStackCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteStack: AppBlock = {
  name: "Delete Stack",
  description: `Deletes a specified stack.`,
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
        StackName: {
          name: "Stack Name",
          description:
            "The name or the unique stack ID that's associated with the stack.",
          type: "string",
          required: true,
        },
        RetainResources: {
          name: "Retain Resources",
          description:
            "For stacks in the DELETE_FAILED state, a list of resource logical IDs that are associated with the resources you want to retain.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        RoleARN: {
          name: "Role ARN",
          description:
            "The Amazon Resource Name (ARN) of an IAM role that CloudFormation assumes to delete the stack.",
          type: "string",
          required: false,
        },
        ClientRequestToken: {
          name: "Client Request Token",
          description: "A unique identifier for this DeleteStack request.",
          type: "string",
          required: false,
        },
        DeletionMode: {
          name: "Deletion Mode",
          description: "Specifies the deletion mode for the stack.",
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeleteStackCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Stack Result",
      description: "Result from DeleteStack operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default deleteStack;

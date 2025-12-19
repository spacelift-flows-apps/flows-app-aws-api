import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DescribeStackRefactorCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeStackRefactor: AppBlock = {
  name: "Describe Stack Refactor",
  description: `Describes the stack refactor status.`,
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
        StackRefactorId: {
          name: "Stack Refactor Id",
          description:
            "The ID associated with the stack refactor created from the CreateStackRefactor action.",
          type: "string",
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeStackRefactorCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Stack Refactor Result",
      description: "Result from DescribeStackRefactor operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Description: {
            type: "string",
            description: "A description to help you identify the refactor.",
          },
          StackRefactorId: {
            type: "string",
            description:
              "The ID associated with the stack refactor created from the CreateStackRefactor action.",
          },
          StackIds: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The unique ID for each stack.",
          },
          ExecutionStatus: {
            type: "string",
            description:
              "The stack refactor execution operation status that's provided after calling the ExecuteStackRefactor action.",
          },
          ExecutionStatusReason: {
            type: "string",
            description:
              "A detailed explanation for the stack refactor ExecutionStatus.",
          },
          Status: {
            type: "string",
            description:
              "The stack refactor operation status that's provided after calling the CreateStackRefactor action.",
          },
          StatusReason: {
            type: "string",
            description:
              "A detailed explanation for the stack refactor operation Status.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeStackRefactor;

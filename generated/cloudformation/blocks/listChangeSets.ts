import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  ListChangeSetsCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listChangeSets: AppBlock = {
  name: "List Change Sets",
  description: `Returns the ID and status of each active change set for a stack.`,
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
            "The name or the Amazon Resource Name (ARN) of the stack for which you want to list change sets.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description:
            "A string (provided by the ListChangeSets response output) that identifies the next page of change sets that you want to retrieve.",
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
            credentials: credentials,
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListChangeSetsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Change Sets Result",
      description: "Result from ListChangeSets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Summaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                StackId: {
                  type: "string",
                },
                StackName: {
                  type: "string",
                },
                ChangeSetId: {
                  type: "string",
                },
                ChangeSetName: {
                  type: "string",
                },
                ExecutionStatus: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                StatusReason: {
                  type: "string",
                },
                CreationTime: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                IncludeNestedStacks: {
                  type: "boolean",
                },
                ParentChangeSetId: {
                  type: "string",
                },
                RootChangeSetId: {
                  type: "string",
                },
                ImportExistingResources: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of ChangeSetSummary structures that provides the ID and status of each change set for the specified stack.",
          },
          NextToken: {
            type: "string",
            description:
              "If the output exceeds 1 MB, a string that identifies the next page of change sets.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listChangeSets;

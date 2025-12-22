import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  ListStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listStacks: AppBlock = {
  name: "List Stacks",
  description: `Returns the summary information for stacks whose status matches the specified StackStatusFilter.`,
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
          description:
            "A string that identifies the next page of stacks that you want to retrieve.",
          type: "string",
          required: false,
        },
        StackStatusFilter: {
          name: "Stack Status Filter",
          description: "Stack status to use as a filter.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListStacksCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Stacks Result",
      description: "Result from ListStacks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StackSummaries: {
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
                TemplateDescription: {
                  type: "string",
                },
                CreationTime: {
                  type: "string",
                },
                LastUpdatedTime: {
                  type: "string",
                },
                DeletionTime: {
                  type: "string",
                },
                StackStatus: {
                  type: "string",
                },
                StackStatusReason: {
                  type: "string",
                },
                ParentId: {
                  type: "string",
                },
                RootId: {
                  type: "string",
                },
                DriftInformation: {
                  type: "object",
                  properties: {
                    StackDriftStatus: {
                      type: "string",
                    },
                    LastCheckTimestamp: {
                      type: "string",
                    },
                  },
                  required: ["StackDriftStatus"],
                  additionalProperties: false,
                },
              },
              required: ["StackName", "CreationTime", "StackStatus"],
              additionalProperties: false,
            },
            description:
              "A list of StackSummary structures that contains information about the specified stacks.",
          },
          NextToken: {
            type: "string",
            description:
              "If the output exceeds 1 MB in size, a string that identifies the next page of stacks.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listStacks;

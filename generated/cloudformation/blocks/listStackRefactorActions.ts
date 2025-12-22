import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  ListStackRefactorActionsCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listStackRefactorActions: AppBlock = {
  name: "List Stack Refactor Actions",
  description: `Lists the stack refactor actions that will be taken after calling the ExecuteStackRefactor action.`,
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
        NextToken: {
          name: "Next Token",
          description:
            "If the request doesn't return all the remaining results, NextToken is set to a token.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to be returned with a single call.",
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

        const command = new ListStackRefactorActionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Stack Refactor Actions Result",
      description: "Result from ListStackRefactorActions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StackRefactorActions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Action: {
                  type: "string",
                },
                Entity: {
                  type: "string",
                },
                PhysicalResourceId: {
                  type: "string",
                },
                ResourceIdentifier: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                Detection: {
                  type: "string",
                },
                DetectionReason: {
                  type: "string",
                },
                TagResources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Key", "Value"],
                    additionalProperties: false,
                  },
                },
                UntagResources: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                ResourceMapping: {
                  type: "object",
                  properties: {
                    Source: {
                      type: "object",
                      properties: {
                        StackName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        LogicalResourceId: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["StackName", "LogicalResourceId"],
                      additionalProperties: false,
                    },
                    Destination: {
                      type: "object",
                      properties: {
                        StackName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        LogicalResourceId: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["StackName", "LogicalResourceId"],
                      additionalProperties: false,
                    },
                  },
                  required: ["Source", "Destination"],
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "The stack refactor actions.",
          },
          NextToken: {
            type: "string",
            description:
              "If the request doesn't return all the remaining results, NextToken is set to a token.",
          },
        },
        required: ["StackRefactorActions"],
      },
    },
  },
};

export default listStackRefactorActions;

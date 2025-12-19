import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  CreateStackRefactorCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createStackRefactor: AppBlock = {
  name: "Create Stack Refactor",
  description: `Creates a refactor across multiple stacks, with the list of stacks and resources that are affected.`,
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
        Description: {
          name: "Description",
          description: "A description to help you identify the stack refactor.",
          type: "string",
          required: false,
        },
        EnableStackCreation: {
          name: "Enable Stack Creation",
          description:
            "Determines if a new stack is created with the refactor.",
          type: "boolean",
          required: false,
        },
        ResourceMappings: {
          name: "Resource Mappings",
          description:
            "The mappings for the stack resource Source and stack resource Destination.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Source: {
                  type: "object",
                  properties: {
                    StackName: {
                      type: "string",
                    },
                    LogicalResourceId: {
                      type: "string",
                    },
                  },
                  required: ["StackName", "LogicalResourceId"],
                  additionalProperties: false,
                },
                Destination: {
                  type: "object",
                  properties: {
                    StackName: {
                      type: "string",
                    },
                    LogicalResourceId: {
                      type: "string",
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
          required: false,
        },
        StackDefinitions: {
          name: "Stack Definitions",
          description: "The stacks being refactored.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                StackName: {
                  type: "string",
                },
                TemplateBody: {
                  type: "string",
                },
                TemplateURL: {
                  type: "string",
                },
              },
              additionalProperties: false,
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateStackRefactorCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Stack Refactor Result",
      description: "Result from CreateStackRefactor operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StackRefactorId: {
            type: "string",
            description:
              "The ID associated with the stack refactor created from the CreateStackRefactor action.",
          },
        },
        required: ["StackRefactorId"],
      },
    },
  },
};

export default createStackRefactor;

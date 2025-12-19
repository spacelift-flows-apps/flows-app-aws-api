import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  CreateChangeSetCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createChangeSet: AppBlock = {
  name: "Create Change Set",
  description: `Creates a list of changes that will be applied to a stack so that you can review the changes before executing them.`,
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
            "The name or the unique ID of the stack for which you are creating a change set.",
          type: "string",
          required: true,
        },
        TemplateBody: {
          name: "Template Body",
          description:
            "A structure that contains the body of the revised template, with a minimum length of 1 byte and a maximum length of 51,200 bytes.",
          type: "string",
          required: false,
        },
        TemplateURL: {
          name: "Template URL",
          description:
            "The URL of the file that contains the revised template.",
          type: "string",
          required: false,
        },
        UsePreviousTemplate: {
          name: "Use Previous Template",
          description:
            "Whether to reuse the template that's associated with the stack to create the change set.",
          type: "boolean",
          required: false,
        },
        Parameters: {
          name: "Parameters",
          description:
            "A list of Parameter structures that specify input parameters for the change set.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ParameterKey: {
                  type: "string",
                },
                ParameterValue: {
                  type: "string",
                },
                UsePreviousValue: {
                  type: "boolean",
                },
                ResolvedValue: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        Capabilities: {
          name: "Capabilities",
          description:
            "In some cases, you must explicitly acknowledge that your stack template contains certain capabilities in order for CloudFormation to create the stack.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ResourceTypes: {
          name: "Resource Types",
          description:
            "The template resource types that you have permissions to work with if you execute this change set, such as AWS::EC2::Instance, AWS::EC2::*, or Custom::MyCustomInstance.",
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
            "The Amazon Resource Name (ARN) of an IAM role that CloudFormation assumes when executing the change set.",
          type: "string",
          required: false,
        },
        RollbackConfiguration: {
          name: "Rollback Configuration",
          description:
            "The rollback triggers for CloudFormation to monitor during stack creation and updating operations, and for the specified monitoring period afterwards.",
          type: {
            type: "object",
            properties: {
              RollbackTriggers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Arn: {
                      type: "string",
                    },
                    Type: {
                      type: "string",
                    },
                  },
                  required: ["Arn", "Type"],
                  additionalProperties: false,
                },
              },
              MonitoringTimeInMinutes: {
                type: "number",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        NotificationARNs: {
          name: "Notification AR Ns",
          description:
            "The Amazon Resource Names (ARNs) of Amazon SNS topics that CloudFormation associates with the stack.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "Key-value pairs to associate with this stack.",
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
        ChangeSetName: {
          name: "Change Set Name",
          description: "The name of the change set.",
          type: "string",
          required: true,
        },
        ClientToken: {
          name: "Client Token",
          description: "A unique identifier for this CreateChangeSet request.",
          type: "string",
          required: false,
        },
        Description: {
          name: "Description",
          description: "A description to help you identify this change set.",
          type: "string",
          required: false,
        },
        ChangeSetType: {
          name: "Change Set Type",
          description: "The type of change set operation.",
          type: "string",
          required: false,
        },
        ResourcesToImport: {
          name: "Resources To Import",
          description: "The resources to import into your stack.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ResourceType: {
                  type: "string",
                },
                LogicalResourceId: {
                  type: "string",
                },
                ResourceIdentifier: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
              },
              required: [
                "ResourceType",
                "LogicalResourceId",
                "ResourceIdentifier",
              ],
              additionalProperties: false,
            },
          },
          required: false,
        },
        IncludeNestedStacks: {
          name: "Include Nested Stacks",
          description:
            "Creates a change set for the all nested stacks specified in the template.",
          type: "boolean",
          required: false,
        },
        OnStackFailure: {
          name: "On Stack Failure",
          description:
            "Determines what action will be taken if stack creation fails.",
          type: "string",
          required: false,
        },
        ImportExistingResources: {
          name: "Import Existing Resources",
          description:
            "Indicates if the change set auto-imports resources that already exist.",
          type: "boolean",
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

        const command = new CreateChangeSetCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Change Set Result",
      description: "Result from CreateChangeSet operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Id: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the change set.",
          },
          StackId: {
            type: "string",
            description: "The unique ID of the stack.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createChangeSet;

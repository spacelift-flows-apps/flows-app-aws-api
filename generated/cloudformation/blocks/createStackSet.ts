import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  CreateStackSetCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createStackSet: AppBlock = {
  name: "Create Stack Set",
  description: `Creates a stack set.`,
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
        StackSetName: {
          name: "Stack Set Name",
          description: "The name to associate with the stack set.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "A description of the stack set.",
          type: "string",
          required: false,
        },
        TemplateBody: {
          name: "Template Body",
          description:
            "The structure that contains the template body, with a minimum length of 1 byte and a maximum length of 51,200 bytes.",
          type: "string",
          required: false,
        },
        TemplateURL: {
          name: "Template URL",
          description: "The URL of a file that contains the template body.",
          type: "string",
          required: false,
        },
        StackId: {
          name: "Stack Id",
          description: "The stack ID you are importing into a new stack set.",
          type: "string",
          required: false,
        },
        Parameters: {
          name: "Parameters",
          description: "The input parameters for the stack set template.",
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
            "In some cases, you must explicitly acknowledge that your stack set template contains certain capabilities in order for CloudFormation to create the stack set and related stack instances.",
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
          description:
            "The key-value pairs to associate with this stack set and the stacks created from it.",
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
        AdministrationRoleARN: {
          name: "Administration Role ARN",
          description:
            "The Amazon Resource Name (ARN) of the IAM role to use to create this stack set.",
          type: "string",
          required: false,
        },
        ExecutionRoleName: {
          name: "Execution Role Name",
          description:
            "The name of the IAM execution role to use to create the stack set.",
          type: "string",
          required: false,
        },
        PermissionModel: {
          name: "Permission Model",
          description:
            "Describes how the IAM roles required for stack set operations are created.",
          type: "string",
          required: false,
        },
        AutoDeployment: {
          name: "Auto Deployment",
          description:
            "Describes whether StackSets automatically deploys to Organizations accounts that are added to the target organization or organizational unit (OU).",
          type: {
            type: "object",
            properties: {
              Enabled: {
                type: "boolean",
              },
              RetainStacksOnAccountRemoval: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        CallAs: {
          name: "Call As",
          description:
            "Specifies whether you are acting as an account administrator in the organization's management account or as a delegated administrator in a member account.",
          type: "string",
          required: false,
        },
        ClientRequestToken: {
          name: "Client Request Token",
          description: "A unique identifier for this CreateStackSet request.",
          type: "string",
          required: false,
        },
        ManagedExecution: {
          name: "Managed Execution",
          description:
            "Describes whether StackSets performs non-conflicting operations concurrently and queues conflicting operations.",
          type: {
            type: "object",
            properties: {
              Active: {
                type: "boolean",
              },
            },
            additionalProperties: false,
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

        const command = new CreateStackSetCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Stack Set Result",
      description: "Result from CreateStackSet operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StackSetId: {
            type: "string",
            description: "The ID of the stack set that you're creating.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createStackSet;

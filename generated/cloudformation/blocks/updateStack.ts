import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  UpdateStackCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateStack: AppBlock = {
  name: "Update Stack",
  description: `Updates a stack as specified in the template.`,
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
          description: "The name or unique stack ID of the stack to update.",
          type: "string",
          required: true,
        },
        TemplateBody: {
          name: "Template Body",
          description:
            "Structure that contains the template body with a minimum length of 1 byte and a maximum length of 51,200 bytes.",
          type: "string",
          required: false,
        },
        TemplateURL: {
          name: "Template URL",
          description: "The URL of a file that contains the template body.",
          type: "string",
          required: false,
        },
        UsePreviousTemplate: {
          name: "Use Previous Template",
          description:
            "Reuse the existing template that is associated with the stack that you are updating.",
          type: "boolean",
          required: false,
        },
        StackPolicyDuringUpdateBody: {
          name: "Stack Policy During Update Body",
          description:
            "Structure that contains the temporary overriding stack policy body.",
          type: "string",
          required: false,
        },
        StackPolicyDuringUpdateURL: {
          name: "Stack Policy During Update URL",
          description:
            "Location of a file that contains the temporary overriding stack policy.",
          type: "string",
          required: false,
        },
        Parameters: {
          name: "Parameters",
          description:
            "A list of Parameter structures that specify input parameters for the stack.",
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
            "In some cases, you must explicitly acknowledge that your stack template contains certain capabilities in order for CloudFormation to update the stack.",
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
            "The template resource types that you have permissions to work with for this update stack action, such as AWS::EC2::Instance, AWS::EC2::*, or Custom::MyCustomInstance.",
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
            "The Amazon Resource Name (ARN) of an IAM role that CloudFormation assumes to update the stack.",
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
        StackPolicyBody: {
          name: "Stack Policy Body",
          description: "Structure that contains a new stack policy body.",
          type: "string",
          required: false,
        },
        StackPolicyURL: {
          name: "Stack Policy URL",
          description:
            "Location of a file that contains the updated stack policy.",
          type: "string",
          required: false,
        },
        NotificationARNs: {
          name: "Notification AR Ns",
          description:
            "Amazon Simple Notification Service topic Amazon Resource Names (ARNs) that CloudFormation associates with the stack.",
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
        DisableRollback: {
          name: "Disable Rollback",
          description:
            "Preserve the state of previously provisioned resources when an operation fails.",
          type: "boolean",
          required: false,
        },
        ClientRequestToken: {
          name: "Client Request Token",
          description: "A unique identifier for this UpdateStack request.",
          type: "string",
          required: false,
        },
        RetainExceptOnCreate: {
          name: "Retain Except On Create",
          description:
            "When set to true, newly created resources are deleted when the operation rolls back.",
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

        const command = new UpdateStackCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Stack Result",
      description: "Result from UpdateStack operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StackId: {
            type: "string",
            description: "Unique identifier of the stack.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateStack;

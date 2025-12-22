import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  CreateStackCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createStack: AppBlock = {
  name: "Create Stack",
  description: `Creates a stack as specified in the template.`,
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
          description: "The name that's associated with the stack.",
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
        DisableRollback: {
          name: "Disable Rollback",
          description:
            "Set to true to disable rollback of the stack if stack creation failed.",
          type: "boolean",
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
        TimeoutInMinutes: {
          name: "Timeout In Minutes",
          description:
            "The amount of time that can pass before the stack status becomes CREATE_FAILED; if DisableRollback is not set or is set to false, the stack will be rolled back.",
          type: "number",
          required: false,
        },
        NotificationARNs: {
          name: "Notification AR Ns",
          description:
            "The Amazon SNS topic ARNs to publish stack related events.",
          type: {
            type: "array",
            items: {
              type: "string",
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
            "The template resource types that you have permissions to work with for this create stack action, such as AWS::EC2::Instance, AWS::EC2::*, or Custom::MyCustomInstance.",
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
            "The Amazon Resource Name (ARN) of an IAM role that CloudFormation assumes to create the stack.",
          type: "string",
          required: false,
        },
        OnFailure: {
          name: "On Failure",
          description:
            "Determines what action will be taken if stack creation fails.",
          type: "string",
          required: false,
        },
        StackPolicyBody: {
          name: "Stack Policy Body",
          description: "Structure that contains the stack policy body.",
          type: "string",
          required: false,
        },
        StackPolicyURL: {
          name: "Stack Policy URL",
          description: "Location of a file that contains the stack policy.",
          type: "string",
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
        ClientRequestToken: {
          name: "Client Request Token",
          description: "A unique identifier for this CreateStack request.",
          type: "string",
          required: false,
        },
        EnableTerminationProtection: {
          name: "Enable Termination Protection",
          description:
            "Whether to enable termination protection on the specified stack.",
          type: "boolean",
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

        const command = new CreateStackCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Stack Result",
      description: "Result from CreateStack operation",
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

export default createStack;

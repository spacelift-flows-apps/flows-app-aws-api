import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  CreateGeneratedTemplateCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createGeneratedTemplate: AppBlock = {
  name: "Create Generated Template",
  description: `Creates a template from existing resources that are not already managed with CloudFormation.`,
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
        Resources: {
          name: "Resources",
          description:
            "An optional list of resources to be included in the generated template.",
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
              required: ["ResourceType", "ResourceIdentifier"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        GeneratedTemplateName: {
          name: "Generated Template Name",
          description: "The name assigned to the generated template.",
          type: "string",
          required: true,
        },
        StackName: {
          name: "Stack Name",
          description:
            "An optional name or ARN of a stack to use as the base stack for the generated template.",
          type: "string",
          required: false,
        },
        TemplateConfiguration: {
          name: "Template Configuration",
          description:
            "The configuration details of the generated template, including the DeletionPolicy and UpdateReplacePolicy.",
          type: {
            type: "object",
            properties: {
              DeletionPolicy: {
                type: "string",
              },
              UpdateReplacePolicy: {
                type: "string",
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

        const command = new CreateGeneratedTemplateCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Generated Template Result",
      description: "Result from CreateGeneratedTemplate operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          GeneratedTemplateId: {
            type: "string",
            description: "The ID of the generated template.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createGeneratedTemplate;

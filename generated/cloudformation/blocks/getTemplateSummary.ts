import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  GetTemplateSummaryCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getTemplateSummary: AppBlock = {
  name: "Get Template Summary",
  description: `Returns information about a new or existing template.`,
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
        StackName: {
          name: "Stack Name",
          description:
            "The name or the stack ID that's associated with the stack, which aren't always interchangeable.",
          type: "string",
          required: false,
        },
        StackSetName: {
          name: "Stack Set Name",
          description:
            "The name or unique ID of the stack set from which the stack was created.",
          type: "string",
          required: false,
        },
        CallAs: {
          name: "Call As",
          description:
            "[Service-managed permissions] Specifies whether you are acting as an account administrator in the organization's management account or as a delegated administrator in a member account.",
          type: "string",
          required: false,
        },
        TemplateSummaryConfig: {
          name: "Template Summary Config",
          description:
            "Specifies options for the GetTemplateSummary API action.",
          type: {
            type: "object",
            properties: {
              TreatUnrecognizedResourceTypesAsWarnings: {
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

        const command = new GetTemplateSummaryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Template Summary Result",
      description: "Result from GetTemplateSummary operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Parameters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ParameterKey: {
                  type: "string",
                },
                DefaultValue: {
                  type: "string",
                },
                ParameterType: {
                  type: "string",
                },
                NoEcho: {
                  type: "boolean",
                },
                Description: {
                  type: "string",
                },
                ParameterConstraints: {
                  type: "object",
                  properties: {
                    AllowedValues: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of parameter declarations that describe various properties for each parameter.",
          },
          Description: {
            type: "string",
            description:
              "The value that's defined in the Description property of the template.",
          },
          Capabilities: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The capabilities found within the template.",
          },
          CapabilitiesReason: {
            type: "string",
            description:
              "The list of resources that generated the values in the Capabilities response element.",
          },
          ResourceTypes: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "A list of all the template resource types that are defined in the template, such as AWS::EC2::Instance, AWS::Dynamo::Table, and Custom::MyCustomInstance.",
          },
          Version: {
            type: "string",
            description:
              "The Amazon Web Services template format version, which identifies the capabilities of the template.",
          },
          Metadata: {
            type: "string",
            description:
              "The value that's defined for the Metadata property of the template.",
          },
          DeclaredTransforms: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "A list of the transforms that are declared in the template.",
          },
          ResourceIdentifierSummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ResourceType: {
                  type: "string",
                },
                LogicalResourceIds: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                ResourceIdentifiers: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of resource identifier summaries that describe the target resources of an import operation and the properties you can provide during the import to identify the target resources.",
          },
          Warnings: {
            type: "object",
            properties: {
              UnrecognizedResourceTypes: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
            description: "An object that contains any warnings returned.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getTemplateSummary;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DescribeTypeCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeType: AppBlock = {
  name: "Describe Type",
  description: `Returns detailed information about an extension that has been registered.`,
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
        Type: {
          name: "Type",
          description: "The kind of extension.",
          type: "string",
          required: false,
        },
        TypeName: {
          name: "Type Name",
          description: "The name of the extension.",
          type: "string",
          required: false,
        },
        Arn: {
          name: "Arn",
          description: "The Amazon Resource Name (ARN) of the extension.",
          type: "string",
          required: false,
        },
        VersionId: {
          name: "Version Id",
          description: "The ID of a specific version of the extension.",
          type: "string",
          required: false,
        },
        PublisherId: {
          name: "Publisher Id",
          description: "The publisher ID of the extension publisher.",
          type: "string",
          required: false,
        },
        PublicVersionNumber: {
          name: "Public Version Number",
          description: "The version number of a public third-party extension.",
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

        const command = new DescribeTypeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Type Result",
      description: "Result from DescribeType operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Arn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the extension.",
          },
          Type: {
            type: "string",
            description: "The kind of extension.",
          },
          TypeName: {
            type: "string",
            description: "The name of the extension.",
          },
          DefaultVersionId: {
            type: "string",
            description: "The ID of the default version of the extension.",
          },
          IsDefaultVersion: {
            type: "boolean",
            description:
              "Whether the specified extension version is set as the default version.",
          },
          TypeTestsStatus: {
            type: "string",
            description:
              "The contract test status of the registered extension version.",
          },
          TypeTestsStatusDescription: {
            type: "string",
            description: "The description of the test status.",
          },
          Description: {
            type: "string",
            description: "The description of the extension.",
          },
          Schema: {
            type: "string",
            description: "The schema that defines the extension.",
          },
          ProvisioningType: {
            type: "string",
            description:
              "For resource type extensions, the provisioning behavior of the resource type.",
          },
          DeprecatedStatus: {
            type: "string",
            description: "The deprecation status of the extension version.",
          },
          LoggingConfig: {
            type: "object",
            properties: {
              LogRoleArn: {
                type: "string",
              },
              LogGroupName: {
                type: "string",
              },
            },
            required: ["LogRoleArn", "LogGroupName"],
            additionalProperties: false,
            description:
              "Contains logging configuration information for private extensions.",
          },
          RequiredActivatedTypes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                TypeNameAlias: {
                  type: "string",
                },
                OriginalTypeName: {
                  type: "string",
                },
                PublisherId: {
                  type: "string",
                },
                SupportedMajorVersions: {
                  type: "array",
                  items: {
                    type: "number",
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "For extensions that are modules, the public third-party extensions that must be activated in your account in order for the module itself to be activated.",
          },
          ExecutionRoleArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the IAM execution role used to register the extension.",
          },
          Visibility: {
            type: "string",
            description:
              "The scope at which the extension is visible and usable in CloudFormation operations.",
          },
          SourceUrl: {
            type: "string",
            description: "The URL of the source code for the extension.",
          },
          DocumentationUrl: {
            type: "string",
            description:
              "The URL of a page providing detailed documentation for this extension.",
          },
          LastUpdated: {
            type: "string",
            description: "When the specified extension version was registered.",
          },
          TimeCreated: {
            type: "string",
            description:
              "When the specified private extension version was registered or activated in your account.",
          },
          ConfigurationSchema: {
            type: "string",
            description:
              "A JSON string that represent the current configuration data for the extension in this account and Region.",
          },
          PublisherId: {
            type: "string",
            description: "The publisher ID of the extension publisher.",
          },
          OriginalTypeName: {
            type: "string",
            description:
              "For public extensions that have been activated for this account and Region, the type name of the public extension.",
          },
          OriginalTypeArn: {
            type: "string",
            description:
              "For public extensions that have been activated for this account and Region, the Amazon Resource Name (ARN) of the public extension.",
          },
          PublicVersionNumber: {
            type: "string",
            description:
              "The version number of a public third-party extension.",
          },
          LatestPublicVersion: {
            type: "string",
            description:
              "The latest version of a public extension that is available for use.",
          },
          IsActivated: {
            type: "boolean",
            description:
              "Whether the extension is activated in the account and Region.",
          },
          AutoUpdate: {
            type: "boolean",
            description:
              "Whether CloudFormation automatically updates the extension in this account and Region when a new minor version is published by the extension publisher.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeType;

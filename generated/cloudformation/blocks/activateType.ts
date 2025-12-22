import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  ActivateTypeCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const activateType: AppBlock = {
  name: "Activate Type",
  description: `Activates a public third-party extension, making it available for use in stack templates.`,
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
          description: "The extension type.",
          type: "string",
          required: false,
        },
        PublicTypeArn: {
          name: "Public Type Arn",
          description:
            "The Amazon Resource Name (ARN) of the public extension.",
          type: "string",
          required: false,
        },
        PublisherId: {
          name: "Publisher Id",
          description: "The ID of the extension publisher.",
          type: "string",
          required: false,
        },
        TypeName: {
          name: "Type Name",
          description: "The name of the extension.",
          type: "string",
          required: false,
        },
        TypeNameAlias: {
          name: "Type Name Alias",
          description:
            "An alias to assign to the public extension, in this account and Region.",
          type: "string",
          required: false,
        },
        AutoUpdate: {
          name: "Auto Update",
          description:
            "Whether to automatically update the extension in this account and Region when a new minor version is published by the extension publisher.",
          type: "boolean",
          required: false,
        },
        LoggingConfig: {
          name: "Logging Config",
          description:
            "Contains logging configuration information for an extension.",
          type: {
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
          },
          required: false,
        },
        ExecutionRoleArn: {
          name: "Execution Role Arn",
          description:
            "The name of the IAM execution role to use to activate the extension.",
          type: "string",
          required: false,
        },
        VersionBump: {
          name: "Version Bump",
          description:
            "Manually updates a previously-activated type to a new major or minor version, if available.",
          type: "string",
          required: false,
        },
        MajorVersion: {
          name: "Major Version",
          description:
            "The major version of this extension you want to activate, if multiple major versions are available.",
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

        const command = new ActivateTypeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Activate Type Result",
      description: "Result from ActivateType operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Arn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the activated extension, in this account and Region.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default activateType;

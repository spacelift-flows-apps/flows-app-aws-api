import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  RegisterTypeCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const registerType: AppBlock = {
  name: "Register Type",
  description: `Registers an extension with the CloudFormation service.`,
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
          description: "The name of the extension being registered.",
          type: "string",
          required: true,
        },
        SchemaHandlerPackage: {
          name: "Schema Handler Package",
          description:
            "A URL to the S3 bucket that contains the extension project package that contains the necessary files for the extension you want to register.",
          type: "string",
          required: true,
        },
        LoggingConfig: {
          name: "Logging Config",
          description:
            "Specifies logging configuration information for an extension.",
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
            "The Amazon Resource Name (ARN) of the IAM role for CloudFormation to assume when invoking the extension.",
          type: "string",
          required: false,
        },
        ClientRequestToken: {
          name: "Client Request Token",
          description:
            "A unique identifier that acts as an idempotency key for this registration request.",
          type: "string",
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

        const command = new RegisterTypeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Register Type Result",
      description: "Result from RegisterType operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RegistrationToken: {
            type: "string",
            description: "The identifier for this registration request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default registerType;

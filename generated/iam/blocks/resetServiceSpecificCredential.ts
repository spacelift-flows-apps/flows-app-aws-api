import { AppBlock, events } from "@slflows/sdk/v1";
import {
  IAMClient,
  ResetServiceSpecificCredentialCommand,
} from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const resetServiceSpecificCredential: AppBlock = {
  name: "Reset Service Specific Credential",
  description: `Resets the password for a service-specific credential.`,
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
        UserName: {
          name: "User Name",
          description:
            "The name of the IAM user associated with the service-specific credential.",
          type: "string",
          required: false,
        },
        ServiceSpecificCredentialId: {
          name: "Service Specific Credential Id",
          description:
            "The unique identifier of the service-specific credential.",
          type: "string",
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

        const client = new IAMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ResetServiceSpecificCredentialCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Reset Service Specific Credential Result",
      description: "Result from ResetServiceSpecificCredential operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ServiceSpecificCredential: {
            type: "object",
            properties: {
              CreateDate: {
                type: "string",
              },
              ExpirationDate: {
                type: "string",
              },
              ServiceName: {
                type: "string",
              },
              ServiceUserName: {
                type: "string",
              },
              ServicePassword: {
                type: "string",
              },
              ServiceCredentialAlias: {
                type: "string",
              },
              ServiceCredentialSecret: {
                type: "string",
              },
              ServiceSpecificCredentialId: {
                type: "string",
              },
              UserName: {
                type: "string",
              },
              Status: {
                type: "string",
              },
            },
            required: [
              "CreateDate",
              "ServiceName",
              "ServiceSpecificCredentialId",
              "UserName",
              "Status",
            ],
            additionalProperties: false,
            description:
              "A structure with details about the updated service-specific credential, including the new password.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default resetServiceSpecificCredential;

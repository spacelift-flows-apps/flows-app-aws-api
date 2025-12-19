import { AppBlock, events } from "@slflows/sdk/v1";
import {
  IAMClient,
  GetAccountPasswordPolicyCommand,
} from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getAccountPasswordPolicy: AppBlock = {
  name: "Get Account Password Policy",
  description: `Retrieves the password policy for the Amazon Web Services account.`,
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

        const command = new GetAccountPasswordPolicyCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Account Password Policy Result",
      description: "Result from GetAccountPasswordPolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          PasswordPolicy: {
            type: "object",
            properties: {
              MinimumPasswordLength: {
                type: "number",
              },
              RequireSymbols: {
                type: "boolean",
              },
              RequireNumbers: {
                type: "boolean",
              },
              RequireUppercaseCharacters: {
                type: "boolean",
              },
              RequireLowercaseCharacters: {
                type: "boolean",
              },
              AllowUsersToChangePassword: {
                type: "boolean",
              },
              ExpirePasswords: {
                type: "boolean",
              },
              MaxPasswordAge: {
                type: "number",
              },
              PasswordReusePrevention: {
                type: "number",
              },
              HardExpiry: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description:
              "A structure that contains details about the account's password policy.",
          },
        },
        required: ["PasswordPolicy"],
      },
    },
  },
};

export default getAccountPasswordPolicy;

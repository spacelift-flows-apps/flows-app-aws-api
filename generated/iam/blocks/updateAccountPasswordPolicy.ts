import { AppBlock, events } from "@slflows/sdk/v1";
import {
  IAMClient,
  UpdateAccountPasswordPolicyCommand,
} from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateAccountPasswordPolicy: AppBlock = {
  name: "Update Account Password Policy",
  description: `Updates the password policy settings for the Amazon Web Services account.`,
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
        MinimumPasswordLength: {
          name: "Minimum Password Length",
          description:
            "The minimum number of characters allowed in an IAM user password.",
          type: "number",
          required: false,
        },
        RequireSymbols: {
          name: "Require Symbols",
          description:
            "Specifies whether IAM user passwords must contain at least one of the following non-alphanumeric characters: ! @ # $ % ^ & * ( ) _ + - = [ ] { } | ' If you do not specify a value for this parameter, then the operation uses the default value of false.",
          type: "boolean",
          required: false,
        },
        RequireNumbers: {
          name: "Require Numbers",
          description:
            "Specifies whether IAM user passwords must contain at least one numeric character (0 to 9).",
          type: "boolean",
          required: false,
        },
        RequireUppercaseCharacters: {
          name: "Require Uppercase Characters",
          description:
            "Specifies whether IAM user passwords must contain at least one uppercase character from the ISO basic Latin alphabet (A to Z).",
          type: "boolean",
          required: false,
        },
        RequireLowercaseCharacters: {
          name: "Require Lowercase Characters",
          description:
            "Specifies whether IAM user passwords must contain at least one lowercase character from the ISO basic Latin alphabet (a to z).",
          type: "boolean",
          required: false,
        },
        AllowUsersToChangePassword: {
          name: "Allow Users To Change Password",
          description:
            "Allows all IAM users in your account to use the Amazon Web Services Management Console to change their own passwords.",
          type: "boolean",
          required: false,
        },
        MaxPasswordAge: {
          name: "Max Password Age",
          description: "The number of days that an IAM user password is valid.",
          type: "number",
          required: false,
        },
        PasswordReusePrevention: {
          name: "Password Reuse Prevention",
          description:
            "Specifies the number of previous passwords that IAM users are prevented from reusing.",
          type: "number",
          required: false,
        },
        HardExpiry: {
          name: "Hard Expiry",
          description:
            "Prevents IAM users who are accessing the account via the Amazon Web Services Management Console from setting a new console password after their password has expired.",
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

        const client = new IAMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateAccountPasswordPolicyCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Account Password Policy Result",
      description: "Result from UpdateAccountPasswordPolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default updateAccountPasswordPolicy;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SecretsManagerClient,
  GetRandomPasswordCommand,
} from "@aws-sdk/client-secrets-manager";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getRandomPassword: AppBlock = {
  name: "Get Random Password",
  description: `Generates a random password.`,
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
        PasswordLength: {
          name: "Password Length",
          description: "The length of the password.",
          type: "number",
          required: false,
        },
        ExcludeCharacters: {
          name: "Exclude Characters",
          description:
            "A string of the characters that you don't want in the password.",
          type: "string",
          required: false,
        },
        ExcludeNumbers: {
          name: "Exclude Numbers",
          description:
            "Specifies whether to exclude numbers from the password.",
          type: "boolean",
          required: false,
        },
        ExcludePunctuation: {
          name: "Exclude Punctuation",
          description:
            "Specifies whether to exclude the following punctuation characters from the password: ! \" # $ % & ' ( ) * + , - .",
          type: "boolean",
          required: false,
        },
        ExcludeUppercase: {
          name: "Exclude Uppercase",
          description:
            "Specifies whether to exclude uppercase letters from the password.",
          type: "boolean",
          required: false,
        },
        ExcludeLowercase: {
          name: "Exclude Lowercase",
          description:
            "Specifies whether to exclude lowercase letters from the password.",
          type: "boolean",
          required: false,
        },
        IncludeSpace: {
          name: "Include Space",
          description: "Specifies whether to include the space character.",
          type: "boolean",
          required: false,
        },
        RequireEachIncludedType: {
          name: "Require Each Included Type",
          description:
            "Specifies whether to include at least one upper and lowercase letter, one number, and one punctuation.",
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

        const client = new SecretsManagerClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetRandomPasswordCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Random Password Result",
      description: "Result from GetRandomPassword operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RandomPassword: {
            type: "string",
            description: "A string with the password.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getRandomPassword;

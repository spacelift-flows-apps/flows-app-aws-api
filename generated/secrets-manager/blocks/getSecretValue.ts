import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getSecretValue: AppBlock = {
  name: "Get Secret Value",
  description: `Retrieves the contents of the encrypted fields SecretString or SecretBinary from the specified version of a secret, whichever contains content.`,
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
        SecretId: {
          name: "Secret Id",
          description: "The ARN or name of the secret to retrieve.",
          type: "string",
          required: true,
        },
        VersionId: {
          name: "Version Id",
          description:
            "The unique identifier of the version of the secret to retrieve.",
          type: "string",
          required: false,
        },
        VersionStage: {
          name: "Version Stage",
          description:
            "The staging label of the version of the secret to retrieve.",
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

        const command = new GetSecretValueCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Secret Value Result",
      description: "Result from GetSecretValue operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ARN: {
            type: "string",
            description: "The ARN of the secret.",
          },
          Name: {
            type: "string",
            description: "The friendly name of the secret.",
          },
          VersionId: {
            type: "string",
            description: "The unique identifier of this version of the secret.",
          },
          SecretBinary: {
            type: "string",
            description:
              "The decrypted secret value, if the secret value was originally provided as binary data in the form of a byte array.",
          },
          SecretString: {
            type: "string",
            description:
              "The decrypted secret value, if the secret value was originally provided as a string or through the Secrets Manager console.",
          },
          VersionStages: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "A list of all of the staging labels currently attached to this version of the secret.",
          },
          CreatedDate: {
            type: "string",
            description:
              "The date and time that this version of the secret was created.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getSecretValue;

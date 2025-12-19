import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SecretsManagerClient,
  ValidateResourcePolicyCommand,
} from "@aws-sdk/client-secrets-manager";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const validateResourcePolicy: AppBlock = {
  name: "Validate Resource Policy",
  description: `Validates that a resource policy does not grant a wide range of principals access to your secret.`,
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
          description:
            "The ARN or name of the secret with the resource-based policy you want to validate.",
          type: "string",
          required: false,
        },
        ResourcePolicy: {
          name: "Resource Policy",
          description:
            "A JSON-formatted string that contains an Amazon Web Services resource-based policy.",
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

        const client = new SecretsManagerClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ValidateResourcePolicyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Validate Resource Policy Result",
      description: "Result from ValidateResourcePolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          PolicyValidationPassed: {
            type: "boolean",
            description:
              "True if your policy passes validation, otherwise false.",
          },
          ValidationErrors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CheckName: {
                  type: "string",
                },
                ErrorMessage: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Validation errors if your policy didn't pass validation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default validateResourcePolicy;

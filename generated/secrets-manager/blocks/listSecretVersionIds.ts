import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SecretsManagerClient,
  ListSecretVersionIdsCommand,
} from "@aws-sdk/client-secrets-manager";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listSecretVersionIds: AppBlock = {
  name: "List Secret Version Ids",
  description: `Lists the versions of a secret.`,
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
            "The ARN or name of the secret whose versions you want to list.",
          type: "string",
          required: true,
        },
        MaxResults: {
          name: "Max Results",
          description: "The number of results to include in the response.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "A token that indicates where the output should continue from, if a previous call did not show all results.",
          type: "string",
          required: false,
        },
        IncludeDeprecated: {
          name: "Include Deprecated",
          description:
            "Specifies whether to include versions of secrets that don't have any staging labels attached to them.",
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

        const client = new SecretsManagerClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListSecretVersionIdsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Secret Version Ids Result",
      description: "Result from ListSecretVersionIds operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Versions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                VersionId: {
                  type: "string",
                },
                VersionStages: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                LastAccessedDate: {
                  type: "string",
                },
                CreatedDate: {
                  type: "string",
                },
                KmsKeyIds: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description: "A list of the versions of the secret.",
          },
          NextToken: {
            type: "string",
            description:
              "Secrets Manager includes this value if there's more output available than what is included in the current response.",
          },
          ARN: {
            type: "string",
            description: "The ARN of the secret.",
          },
          Name: {
            type: "string",
            description: "The name of the secret.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listSecretVersionIds;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SecretsManagerClient,
  BatchGetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const batchGetSecretValue: AppBlock = {
  name: "Batch Get Secret Value",
  description: `Retrieves the contents of the encrypted fields SecretString or SecretBinary for up to 20 secrets.`,
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
        SecretIdList: {
          name: "Secret Id List",
          description: "The ARN or names of the secrets to retrieve.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "The filters to choose which secrets to retrieve.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
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

        const command = new BatchGetSecretValueCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Batch Get Secret Value Result",
      description: "Result from BatchGetSecretValue operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SecretValues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ARN: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                VersionId: {
                  type: "string",
                },
                SecretBinary: {
                  type: "string",
                },
                SecretString: {
                  type: "string",
                },
                VersionStages: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                CreatedDate: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of secret values.",
          },
          NextToken: {
            type: "string",
            description:
              "Secrets Manager includes this value if there's more output available than what is included in the current response.",
          },
          Errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                SecretId: {
                  type: "string",
                },
                ErrorCode: {
                  type: "string",
                },
                Message: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of errors Secrets Manager encountered while attempting to retrieve individual secrets.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default batchGetSecretValue;

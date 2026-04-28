import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  CreateTieringConfigurationCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createTieringConfiguration: AppBlock = {
  name: "Create Tiering Configuration",
  description: `Creates a tiering configuration.`,
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
        TieringConfiguration: {
          name: "Tiering Configuration",
          description:
            "A tiering configuration must contain a unique TieringConfigurationName string you create and must contain a BackupVaultName and ResourceSelection.",
          type: {
            type: "object",
            properties: {
              TieringConfigurationName: {
                type: "string",
              },
              BackupVaultName: {
                type: "string",
              },
              ResourceSelection: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Resources: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    TieringDownSettingsInDays: {
                      type: "number",
                    },
                    ResourceType: {
                      type: "string",
                    },
                  },
                  required: [
                    "Resources",
                    "TieringDownSettingsInDays",
                    "ResourceType",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: [
              "TieringConfigurationName",
              "BackupVaultName",
              "ResourceSelection",
            ],
            additionalProperties: false,
          },
          required: true,
        },
        TieringConfigurationTags: {
          name: "Tiering Configuration Tags",
          description: "The tags to assign to the tiering configuration.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        CreatorRequestId: {
          name: "Creator Request Id",
          description:
            "This is a unique string that identifies the request and allows failed requests to be retried without the risk of running the operation twice.",
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

        const client = new BackupClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateTieringConfigurationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Tiering Configuration Result",
      description: "Result from CreateTieringConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TieringConfigurationArn: {
            type: "string",
            description:
              "An Amazon Resource Name (ARN) that uniquely identifies the created tiering configuration.",
          },
          TieringConfigurationName: {
            type: "string",
            description:
              "This unique string is the name of the tiering configuration.",
          },
          CreationTime: {
            type: "string",
            description:
              "The date and time a tiering configuration was created, in Unix format and Coordinated Universal Time (UTC).",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createTieringConfiguration;

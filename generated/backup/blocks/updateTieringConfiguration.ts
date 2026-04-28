import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  UpdateTieringConfigurationCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateTieringConfiguration: AppBlock = {
  name: "Update Tiering Configuration",
  description: `This request will send changes to your specified tiering configuration.`,
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
        TieringConfigurationName: {
          name: "Tiering Configuration Name",
          description: "The name of a tiering configuration to update.",
          type: "string",
          required: true,
        },
        TieringConfiguration: {
          name: "Tiering Configuration",
          description: "Specifies the body of a tiering configuration.",
          type: {
            type: "object",
            properties: {
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
              BackupVaultName: {
                type: "string",
              },
            },
            required: ["ResourceSelection", "BackupVaultName"],
            additionalProperties: false,
          },
          required: true,
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

        const command = new UpdateTieringConfigurationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Tiering Configuration Result",
      description: "Result from UpdateTieringConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TieringConfigurationArn: {
            type: "string",
            description:
              "An Amazon Resource Name (ARN) that uniquely identifies the updated tiering configuration.",
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
          LastUpdatedTime: {
            type: "string",
            description:
              "The date and time a tiering configuration was updated, in Unix format and Coordinated Universal Time (UTC).",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateTieringConfiguration;

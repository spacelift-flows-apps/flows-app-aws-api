import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  GetTieringConfigurationCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getTieringConfiguration: AppBlock = {
  name: "Get Tiering Configuration",
  description: `Returns TieringConfiguration details for the specified TieringConfigurationName.`,
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
          description: "The unique name of a tiering configuration.",
          type: "string",
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

        const command = new GetTieringConfigurationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Tiering Configuration Result",
      description: "Result from GetTieringConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TieringConfiguration: {
            type: "object",
            properties: {
              TieringConfigurationName: {
                type: "string",
              },
              TieringConfigurationArn: {
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
              CreatorRequestId: {
                type: "string",
              },
              CreationTime: {
                type: "string",
              },
              LastUpdatedTime: {
                type: "string",
              },
            },
            required: [
              "TieringConfigurationName",
              "BackupVaultName",
              "ResourceSelection",
            ],
            additionalProperties: false,
            description: "Specifies the body of a tiering configuration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getTieringConfiguration;

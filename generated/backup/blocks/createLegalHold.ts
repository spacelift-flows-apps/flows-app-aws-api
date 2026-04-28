import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, CreateLegalHoldCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const createLegalHold: AppBlock = {
  name: "Create Legal Hold",
  description: `Creates a legal hold on a recovery point (backup).`,
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
        Title: {
          name: "Title",
          description: "The title of the legal hold.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "The description of the legal hold.",
          type: "string",
          required: true,
        },
        IdempotencyToken: {
          name: "Idempotency Token",
          description:
            "This is a user-chosen string used to distinguish between otherwise identical calls.",
          type: "string",
          required: false,
        },
        RecoveryPointSelection: {
          name: "Recovery Point Selection",
          description:
            "The criteria to assign a set of resources, such as resource types or backup vaults.",
          type: {
            type: "object",
            properties: {
              VaultNames: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              ResourceIdentifiers: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              DateRange: {
                type: "object",
                properties: {
                  FromDate: {
                    type: "string",
                  },
                  ToDate: {
                    type: "string",
                  },
                },
                required: ["FromDate", "ToDate"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "Optional tags to include.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
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

        const command = new CreateLegalHoldCommand(
          convertTimestamps(
            commandInput,
            new Set(["FromDate", "ToDate"]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Legal Hold Result",
      description: "Result from CreateLegalHold operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Title: {
            type: "string",
            description: "The title of the legal hold.",
          },
          Status: {
            type: "string",
            description: "The status of the legal hold.",
          },
          Description: {
            type: "string",
            description: "The description of the legal hold.",
          },
          LegalHoldId: {
            type: "string",
            description: "The ID of the legal hold.",
          },
          LegalHoldArn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the legal hold.",
          },
          CreationDate: {
            type: "string",
            description: "The time when the legal hold was created.",
          },
          RecoveryPointSelection: {
            type: "object",
            properties: {
              VaultNames: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              ResourceIdentifiers: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              DateRange: {
                type: "object",
                properties: {
                  FromDate: {
                    type: "string",
                  },
                  ToDate: {
                    type: "string",
                  },
                },
                required: ["FromDate", "ToDate"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description:
              "The criteria to assign to a set of resources, such as resource types or backup vaults.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createLegalHold;

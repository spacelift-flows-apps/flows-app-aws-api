import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, GetLegalHoldCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getLegalHold: AppBlock = {
  name: "Get Legal Hold",
  description: `This action returns details for a specified legal hold.`,
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
        LegalHoldId: {
          name: "Legal Hold Id",
          description: "The ID of the legal hold.",
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

        const command = new GetLegalHoldCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Legal Hold Result",
      description: "Result from GetLegalHold operation",
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
          CancelDescription: {
            type: "string",
            description: "The reason for removing the legal hold.",
          },
          LegalHoldId: {
            type: "string",
            description: "The ID of the legal hold.",
          },
          LegalHoldArn: {
            type: "string",
            description: "The framework ARN for the specified legal hold.",
          },
          CreationDate: {
            type: "string",
            description: "The time when the legal hold was created.",
          },
          CancellationDate: {
            type: "string",
            description: "The time when the legal hold was cancelled.",
          },
          RetainRecordUntil: {
            type: "string",
            description:
              "The date and time until which the legal hold record is retained.",
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
              "The criteria to assign a set of resources, such as resource types or backup vaults.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getLegalHold;

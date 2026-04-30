import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  UpdateRestoreTestingSelectionCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateRestoreTestingSelection: AppBlock = {
  name: "Update Restore Testing Selection",
  description: `Updates the specified restore testing selection.`,
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
        RestoreTestingPlanName: {
          name: "Restore Testing Plan Name",
          description:
            "The restore testing plan name is required to update the indicated testing plan.",
          type: "string",
          required: true,
        },
        RestoreTestingSelection: {
          name: "Restore Testing Selection",
          description:
            "To update your restore testing selection, you can use either protected resource ARNs or conditions, but not both.",
          type: {
            type: "object",
            properties: {
              IamRoleArn: {
                type: "string",
              },
              ProtectedResourceArns: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              ProtectedResourceConditions: {
                type: "object",
                properties: {
                  StringEquals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Key: {
                          type: "string",
                        },
                        Value: {
                          type: "string",
                        },
                      },
                      required: ["Key", "Value"],
                      additionalProperties: false,
                    },
                  },
                  StringNotEquals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Key: {
                          type: "string",
                        },
                        Value: {
                          type: "string",
                        },
                      },
                      required: ["Key", "Value"],
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
              RestoreMetadataOverrides: {
                type: "object",
                additionalProperties: {
                  type: "object",
                },
              },
              ValidationWindowHours: {
                type: "number",
              },
            },
            additionalProperties: false,
          },
          required: true,
        },
        RestoreTestingSelectionName: {
          name: "Restore Testing Selection Name",
          description:
            "The required restore testing selection name of the restore testing selection you wish to update.",
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

        const command = new UpdateRestoreTestingSelectionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Restore Testing Selection Result",
      description: "Result from UpdateRestoreTestingSelection operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CreationTime: {
            type: "string",
            description:
              "The time the resource testing selection was updated successfully.",
          },
          RestoreTestingPlanArn: {
            type: "string",
            description:
              "Unique string that is the name of the restore testing plan.",
          },
          RestoreTestingPlanName: {
            type: "string",
            description:
              "The restore testing plan with which the updated restore testing selection is associated.",
          },
          RestoreTestingSelectionName: {
            type: "string",
            description: "The returned restore testing selection name.",
          },
          UpdateTime: {
            type: "string",
            description:
              "The time the update completed for the restore testing selection.",
          },
        },
        required: [
          "CreationTime",
          "RestoreTestingPlanArn",
          "RestoreTestingPlanName",
          "RestoreTestingSelectionName",
          "UpdateTime",
        ],
      },
    },
  },
};

export default updateRestoreTestingSelection;

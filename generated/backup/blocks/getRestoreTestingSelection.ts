import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  GetRestoreTestingSelectionCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getRestoreTestingSelection: AppBlock = {
  name: "Get Restore Testing Selection",
  description: `Returns RestoreTestingSelection, which displays resources and elements of the restore testing plan.`,
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
          description: "Required unique name of the restore testing plan.",
          type: "string",
          required: true,
        },
        RestoreTestingSelectionName: {
          name: "Restore Testing Selection Name",
          description: "Required unique name of the restore testing selection.",
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

        const command = new GetRestoreTestingSelectionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Restore Testing Selection Result",
      description: "Result from GetRestoreTestingSelection operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RestoreTestingSelection: {
            type: "object",
            properties: {
              CreationTime: {
                type: "string",
              },
              CreatorRequestId: {
                type: "string",
              },
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
              ProtectedResourceType: {
                type: "string",
              },
              RestoreMetadataOverrides: {
                type: "object",
                additionalProperties: {
                  type: "object",
                },
              },
              RestoreTestingPlanName: {
                type: "string",
              },
              RestoreTestingSelectionName: {
                type: "string",
              },
              ValidationWindowHours: {
                type: "number",
              },
            },
            required: [
              "CreationTime",
              "IamRoleArn",
              "ProtectedResourceType",
              "RestoreTestingPlanName",
              "RestoreTestingSelectionName",
            ],
            additionalProperties: false,
            description: "Unique name of the restore testing selection.",
          },
        },
        required: ["RestoreTestingSelection"],
      },
    },
  },
};

export default getRestoreTestingSelection;

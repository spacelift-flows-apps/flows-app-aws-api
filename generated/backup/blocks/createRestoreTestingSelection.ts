import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  CreateRestoreTestingSelectionCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createRestoreTestingSelection: AppBlock = {
  name: "Create Restore Testing Selection",
  description: `This request can be sent after CreateRestoreTestingPlan request returns successfully.`,
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
        CreatorRequestId: {
          name: "Creator Request Id",
          description:
            "This is an optional unique string that identifies the request and allows failed requests to be retried without the risk of running the operation twice.",
          type: "string",
          required: false,
        },
        RestoreTestingPlanName: {
          name: "Restore Testing Plan Name",
          description:
            "Input the restore testing plan name that was returned from the related CreateRestoreTestingPlan request.",
          type: "string",
          required: true,
        },
        RestoreTestingSelection: {
          name: "Restore Testing Selection",
          description:
            "This consists of RestoreTestingSelectionName, ProtectedResourceType, and one of the following: ProtectedResourceArns ProtectedResourceConditions Each protected resource type can have one single value.",
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
              ProtectedResourceType: {
                type: "string",
              },
              RestoreMetadataOverrides: {
                type: "object",
                additionalProperties: {
                  type: "object",
                },
              },
              RestoreTestingSelectionName: {
                type: "string",
              },
              ValidationWindowHours: {
                type: "number",
              },
            },
            required: [
              "IamRoleArn",
              "ProtectedResourceType",
              "RestoreTestingSelectionName",
            ],
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

        const command = new CreateRestoreTestingSelectionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Restore Testing Selection Result",
      description: "Result from CreateRestoreTestingSelection operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CreationTime: {
            type: "string",
            description:
              "The time that the resource testing selection was created.",
          },
          RestoreTestingPlanArn: {
            type: "string",
            description:
              "The ARN of the restore testing plan with which the restore testing selection is associated.",
          },
          RestoreTestingPlanName: {
            type: "string",
            description: "The name of the restore testing plan.",
          },
          RestoreTestingSelectionName: {
            type: "string",
            description:
              "The name of the restore testing selection for the related restore testing plan.",
          },
        },
        required: [
          "CreationTime",
          "RestoreTestingPlanArn",
          "RestoreTestingPlanName",
          "RestoreTestingSelectionName",
        ],
      },
    },
  },
};

export default createRestoreTestingSelection;

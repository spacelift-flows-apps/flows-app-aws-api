import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  CreateBackupSelectionCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createBackupSelection: AppBlock = {
  name: "Create Backup Selection",
  description: `Creates a JSON document that specifies a set of resources to assign to a backup plan.`,
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
        BackupPlanId: {
          name: "Backup Plan Id",
          description: "The ID of the backup plan.",
          type: "string",
          required: true,
        },
        BackupSelection: {
          name: "Backup Selection",
          description:
            "The body of a request to assign a set of resources to a backup plan.",
          type: {
            type: "object",
            properties: {
              SelectionName: {
                type: "string",
              },
              IamRoleArn: {
                type: "string",
              },
              Resources: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              ListOfTags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ConditionType: {
                      type: "string",
                    },
                    ConditionKey: {
                      type: "string",
                    },
                    ConditionValue: {
                      type: "string",
                    },
                  },
                  required: ["ConditionType", "ConditionKey", "ConditionValue"],
                  additionalProperties: false,
                },
              },
              NotResources: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              Conditions: {
                type: "object",
                properties: {
                  StringEquals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        ConditionKey: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ConditionValue: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  StringNotEquals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        ConditionKey: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ConditionValue: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  StringLike: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        ConditionKey: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ConditionValue: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  StringNotLike: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        ConditionKey: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ConditionValue: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
            },
            required: ["SelectionName", "IamRoleArn"],
            additionalProperties: false,
          },
          required: true,
        },
        CreatorRequestId: {
          name: "Creator Request Id",
          description:
            "A unique string that identifies the request and allows failed requests to be retried without the risk of running the operation twice.",
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

        const command = new CreateBackupSelectionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Backup Selection Result",
      description: "Result from CreateBackupSelection operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SelectionId: {
            type: "string",
            description:
              "Uniquely identifies the body of a request to assign a set of resources to a backup plan.",
          },
          BackupPlanId: {
            type: "string",
            description: "The ID of the backup plan.",
          },
          CreationDate: {
            type: "string",
            description:
              "The date and time a backup selection is created, in Unix format and Coordinated Universal Time (UTC).",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createBackupSelection;

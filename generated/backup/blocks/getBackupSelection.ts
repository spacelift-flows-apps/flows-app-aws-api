import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  GetBackupSelectionCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getBackupSelection: AppBlock = {
  name: "Get Backup Selection",
  description: `Returns selection metadata and a document in JSON format that specifies a list of resources that are associated with a backup plan.`,
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
          description: "Uniquely identifies a backup plan.",
          type: "string",
          required: true,
        },
        SelectionId: {
          name: "Selection Id",
          description:
            "Uniquely identifies the body of a request to assign a set of resources to a backup plan.",
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

        const command = new GetBackupSelectionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Backup Selection Result",
      description: "Result from GetBackupSelection operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BackupSelection: {
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
            description:
              "Specifies the body of a request to assign a set of resources to a backup plan.",
          },
          SelectionId: {
            type: "string",
            description:
              "Uniquely identifies the body of a request to assign a set of resources to a backup plan.",
          },
          BackupPlanId: {
            type: "string",
            description: "Uniquely identifies a backup plan.",
          },
          CreationDate: {
            type: "string",
            description:
              "The date and time a backup selection is created, in Unix format and Coordinated Universal Time (UTC).",
          },
          CreatorRequestId: {
            type: "string",
            description:
              "A unique string that identifies the request and allows failed requests to be retried without the risk of running the operation twice.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getBackupSelection;

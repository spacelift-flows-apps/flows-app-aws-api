import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  ListStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listStacks: AppBlock = {
  name: "List Stacks",
  description: `Returns the summary information for stacks whose status matches the specified StackStatusFilter.`,
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
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        StackStatusFilter: {
          name: "Stack Status Filter",
          description: "Stack status to use as a filter.",
          type: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "CREATE_IN_PROGRESS",
                "CREATE_FAILED",
                "CREATE_COMPLETE",
                "ROLLBACK_IN_PROGRESS",
                "ROLLBACK_FAILED",
                "ROLLBACK_COMPLETE",
                "DELETE_IN_PROGRESS",
                "DELETE_FAILED",
                "DELETE_COMPLETE",
                "UPDATE_IN_PROGRESS",
                "UPDATE_COMPLETE_CLEANUP_IN_PROGRESS",
                "UPDATE_COMPLETE",
                "UPDATE_FAILED",
                "UPDATE_ROLLBACK_IN_PROGRESS",
                "UPDATE_ROLLBACK_FAILED",
                "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS",
                "UPDATE_ROLLBACK_COMPLETE",
                "REVIEW_IN_PROGRESS",
                "IMPORT_IN_PROGRESS",
                "IMPORT_COMPLETE",
                "IMPORT_ROLLBACK_IN_PROGRESS",
                "IMPORT_ROLLBACK_FAILED",
                "IMPORT_ROLLBACK_COMPLETE",
              ],
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListStacksCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Stacks Result",
      description: "Result from ListStacks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StackSummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                StackId: {
                  type: "string",
                },
                StackName: {
                  type: "string",
                },
                TemplateDescription: {
                  type: "string",
                },
                CreationTime: {
                  type: "string",
                },
                LastUpdatedTime: {
                  type: "string",
                },
                DeletionTime: {
                  type: "string",
                },
                StackStatus: {
                  type: "string",
                  enum: [
                    "CREATE_IN_PROGRESS",
                    "CREATE_FAILED",
                    "CREATE_COMPLETE",
                    "ROLLBACK_IN_PROGRESS",
                    "ROLLBACK_FAILED",
                    "ROLLBACK_COMPLETE",
                    "DELETE_IN_PROGRESS",
                    "DELETE_FAILED",
                    "DELETE_COMPLETE",
                    "UPDATE_IN_PROGRESS",
                    "UPDATE_COMPLETE_CLEANUP_IN_PROGRESS",
                    "UPDATE_COMPLETE",
                    "UPDATE_FAILED",
                    "UPDATE_ROLLBACK_IN_PROGRESS",
                    "UPDATE_ROLLBACK_FAILED",
                    "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS",
                    "UPDATE_ROLLBACK_COMPLETE",
                    "REVIEW_IN_PROGRESS",
                    "IMPORT_IN_PROGRESS",
                    "IMPORT_COMPLETE",
                    "IMPORT_ROLLBACK_IN_PROGRESS",
                    "IMPORT_ROLLBACK_FAILED",
                    "IMPORT_ROLLBACK_COMPLETE",
                  ],
                },
                StackStatusReason: {
                  type: "string",
                },
                ParentId: {
                  type: "string",
                },
                RootId: {
                  type: "string",
                },
                DriftInformation: {
                  type: "object",
                  properties: {
                    StackDriftStatus: {
                      type: "string",
                      enum: ["DRIFTED", "IN_SYNC", "UNKNOWN", "NOT_CHECKED"],
                    },
                    LastCheckTimestamp: {
                      type: "string",
                    },
                  },
                  required: ["StackDriftStatus"],
                  additionalProperties: false,
                },
                LastOperations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      OperationType: {
                        type: "string",
                        enum: [
                          "CREATE_STACK",
                          "UPDATE_STACK",
                          "DELETE_STACK",
                          "CONTINUE_ROLLBACK",
                          "ROLLBACK",
                          "CREATE_CHANGESET",
                        ],
                      },
                      OperationId: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              required: ["StackName", "CreationTime", "StackStatus"],
              additionalProperties: false,
            },
            description:
              "A list of StackSummary structures that contains information about the specified stacks.",
          },
          NextToken: {
            type: "string",
            description:
              "If the output exceeds 1 MB in size, a string that identifies the next page of stacks.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listStacks;

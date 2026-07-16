import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeStacks: AppBlock = {
  name: "Describe Stacks",
  description: `Returns the description for the specified stack; if no stack name was specified, then it returns the description for all the stacks created.`,
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
        StackName: {
          name: "Stack Name",
          description:
            "If you don't pass a parameter to StackName, the API returns a response that describes all resources in the account, which can impact performance.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeStacksCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Stacks Result",
      description: "Result from DescribeStacks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Stacks: {
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
                ChangeSetId: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                Parameters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ParameterKey: {
                        type: "string",
                      },
                      ParameterValue: {
                        type: "string",
                      },
                      UsePreviousValue: {
                        type: "boolean",
                      },
                      ResolvedValue: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                CreationTime: {
                  type: "string",
                },
                DeletionTime: {
                  type: "string",
                },
                LastUpdatedTime: {
                  type: "string",
                },
                RollbackConfiguration: {
                  type: "object",
                  properties: {
                    RollbackTriggers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Arn: {},
                          Type: {},
                        },
                        required: ["Arn", "Type"],
                        additionalProperties: false,
                      },
                    },
                    MonitoringTimeInMinutes: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
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
                DisableRollback: {
                  type: "boolean",
                },
                NotificationARNs: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                TimeoutInMinutes: {
                  type: "number",
                },
                Capabilities: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "CAPABILITY_IAM",
                      "CAPABILITY_NAMED_IAM",
                      "CAPABILITY_AUTO_EXPAND",
                    ],
                  },
                },
                Outputs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      OutputKey: {
                        type: "string",
                      },
                      OutputValue: {
                        type: "string",
                      },
                      Description: {
                        type: "string",
                      },
                      ExportName: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                RoleARN: {
                  type: "string",
                },
                Tags: {
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
                EnableTerminationProtection: {
                  type: "boolean",
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
                RetainExceptOnCreate: {
                  type: "boolean",
                },
                DeletionMode: {
                  type: "string",
                  enum: ["STANDARD", "FORCE_DELETE_STACK"],
                },
                DetailedStatus: {
                  type: "string",
                  enum: ["CONFIGURATION_COMPLETE", "VALIDATION_FAILED"],
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
            description: "A list of stack structures.",
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

export default describeStacks;

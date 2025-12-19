import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DescribeChangeSetCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeChangeSet: AppBlock = {
  name: "Describe Change Set",
  description: `Returns the inputs for the change set and a list of changes that CloudFormation will make if you execute the change set.`,
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
        ChangeSetName: {
          name: "Change Set Name",
          description:
            "The name or Amazon Resource Name (ARN) of the change set that you want to describe.",
          type: "string",
          required: true,
        },
        StackName: {
          name: "Stack Name",
          description:
            "If you specified the name of a change set, specify the stack name or ID (ARN) of the change set you want to describe.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "A string (provided by the DescribeChangeSet response output) that identifies the next page of information that you want to retrieve.",
          type: "string",
          required: false,
        },
        IncludePropertyValues: {
          name: "Include Property Values",
          description:
            "If true, the returned changes include detailed changes in the property values.",
          type: "boolean",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
        if (assumeRoleArn) {
          // Use STS to assume the specified role
          const stsClient = new STSClient({
            region: region,
            credentials: {
              accessKeyId: input.app.config.accessKeyId,
              secretAccessKey: input.app.config.secretAccessKey,
              sessionToken: input.app.config.sessionToken,
            },
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeChangeSetCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Change Set Result",
      description: "Result from DescribeChangeSet operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ChangeSetName: {
            type: "string",
            description: "The name of the change set.",
          },
          ChangeSetId: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the change set.",
          },
          StackId: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the stack that's associated with the change set.",
          },
          StackName: {
            type: "string",
            description:
              "The name of the stack that's associated with the change set.",
          },
          Description: {
            type: "string",
            description: "Information about the change set.",
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
            description:
              "A list of Parameter structures that describes the input parameters and their values used to create the change set.",
          },
          CreationTime: {
            type: "string",
            description:
              "The start time when the change set was created, in UTC.",
          },
          ExecutionStatus: {
            type: "string",
            description:
              "If the change set execution status is AVAILABLE, you can execute the change set.",
          },
          Status: {
            type: "string",
            description:
              "The current status of the change set, such as CREATE_PENDING, CREATE_COMPLETE, or FAILED.",
          },
          StatusReason: {
            type: "string",
            description: "A description of the change set's status.",
          },
          NotificationARNs: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The ARNs of the Amazon SNS topics that will be associated with the stack if you execute the change set.",
          },
          RollbackConfiguration: {
            type: "object",
            properties: {
              RollbackTriggers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Arn: {
                      type: "string",
                    },
                    Type: {
                      type: "string",
                    },
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
            description:
              "The rollback triggers for CloudFormation to monitor during stack creation and updating operations, and for the specified monitoring period afterwards.",
          },
          Capabilities: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "If you execute the change set, the list of capabilities that were explicitly acknowledged when the change set was created.",
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
            description:
              "If you execute the change set, the tags that will be associated with the stack.",
          },
          Changes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Type: {
                  type: "string",
                },
                HookInvocationCount: {
                  type: "number",
                },
                ResourceChange: {
                  type: "object",
                  properties: {
                    PolicyAction: {
                      type: "string",
                    },
                    Action: {
                      type: "string",
                    },
                    LogicalResourceId: {
                      type: "string",
                    },
                    PhysicalResourceId: {
                      type: "string",
                    },
                    ResourceType: {
                      type: "string",
                    },
                    Replacement: {
                      type: "string",
                    },
                    Scope: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Details: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    ChangeSetId: {
                      type: "string",
                    },
                    ModuleInfo: {
                      type: "object",
                      properties: {
                        TypeHierarchy: {
                          type: "object",
                          additionalProperties: true,
                        },
                        LogicalIdHierarchy: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    BeforeContext: {
                      type: "string",
                    },
                    AfterContext: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of Change structures that describes the resources CloudFormation changes if you execute the change set.",
          },
          NextToken: {
            type: "string",
            description:
              "If the output exceeds 1 MB, a string that identifies the next page of changes.",
          },
          IncludeNestedStacks: {
            type: "boolean",
            description: "Verifies if IncludeNestedStacks is set to True.",
          },
          ParentChangeSetId: {
            type: "string",
            description:
              "Specifies the change set ID of the parent change set in the current nested change set hierarchy.",
          },
          RootChangeSetId: {
            type: "string",
            description:
              "Specifies the change set ID of the root change set in the current nested change set hierarchy.",
          },
          OnStackFailure: {
            type: "string",
            description:
              "Determines what action will be taken if stack creation fails.",
          },
          ImportExistingResources: {
            type: "boolean",
            description:
              "Indicates if the change set imports resources that already exist.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeChangeSet;

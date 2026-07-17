import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DescribeEventsCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeEvents: AppBlock = {
  name: "Describe Events",
  description: `Returns CloudFormation events based on flexible query criteria.`,
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
            "The name or unique stack ID for which you want to retrieve events.",
          type: "string",
          required: false,
        },
        ChangeSetName: {
          name: "Change Set Name",
          description:
            "The name or Amazon Resource Name (ARN) of the change set for which you want to retrieve events.",
          type: "string",
          required: false,
        },
        OperationId: {
          name: "Operation Id",
          description:
            "The unique identifier of the operation for which you want to retrieve events.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "Filters to apply when retrieving events.",
          type: {
            type: "object",
            properties: {
              FailedEvents: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
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

        const command = new DescribeEventsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Events Result",
      description: "Result from DescribeEvents operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          OperationEvents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                EventId: {
                  type: "string",
                },
                StackId: {
                  type: "string",
                },
                OperationId: {
                  type: "string",
                },
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
                OperationStatus: {
                  type: "string",
                  enum: ["IN_PROGRESS", "SUCCEEDED", "FAILED"],
                },
                EventType: {
                  type: "string",
                  enum: [
                    "STACK_EVENT",
                    "PROGRESS_EVENT",
                    "VALIDATION_ERROR",
                    "PROVISIONING_ERROR",
                    "HOOK_INVOCATION_ERROR",
                  ],
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
                Timestamp: {
                  type: "string",
                },
                StartTime: {
                  type: "string",
                },
                EndTime: {
                  type: "string",
                },
                ResourceStatus: {
                  type: "string",
                  enum: [
                    "CREATE_IN_PROGRESS",
                    "CREATE_FAILED",
                    "CREATE_COMPLETE",
                    "DELETE_IN_PROGRESS",
                    "DELETE_FAILED",
                    "DELETE_COMPLETE",
                    "DELETE_SKIPPED",
                    "UPDATE_IN_PROGRESS",
                    "UPDATE_FAILED",
                    "UPDATE_COMPLETE",
                    "IMPORT_FAILED",
                    "IMPORT_COMPLETE",
                    "IMPORT_IN_PROGRESS",
                    "IMPORT_ROLLBACK_IN_PROGRESS",
                    "IMPORT_ROLLBACK_FAILED",
                    "IMPORT_ROLLBACK_COMPLETE",
                    "EXPORT_FAILED",
                    "EXPORT_COMPLETE",
                    "EXPORT_IN_PROGRESS",
                    "EXPORT_ROLLBACK_IN_PROGRESS",
                    "EXPORT_ROLLBACK_FAILED",
                    "EXPORT_ROLLBACK_COMPLETE",
                    "UPDATE_ROLLBACK_IN_PROGRESS",
                    "UPDATE_ROLLBACK_COMPLETE",
                    "UPDATE_ROLLBACK_FAILED",
                    "ROLLBACK_IN_PROGRESS",
                    "ROLLBACK_COMPLETE",
                    "ROLLBACK_FAILED",
                  ],
                },
                ResourceStatusReason: {
                  type: "string",
                },
                ResourceProperties: {
                  type: "string",
                },
                ClientRequestToken: {
                  type: "string",
                },
                HookType: {
                  type: "string",
                },
                HookStatus: {
                  type: "string",
                  enum: [
                    "HOOK_IN_PROGRESS",
                    "HOOK_COMPLETE_SUCCEEDED",
                    "HOOK_COMPLETE_FAILED",
                    "HOOK_FAILED",
                  ],
                },
                HookStatusReason: {
                  type: "string",
                },
                HookInvocationPoint: {
                  type: "string",
                  enum: ["PRE_PROVISION"],
                },
                HookFailureMode: {
                  type: "string",
                  enum: ["FAIL", "WARN"],
                },
                DetailedStatus: {
                  type: "string",
                  enum: ["CONFIGURATION_COMPLETE", "VALIDATION_FAILED"],
                },
                ValidationFailureMode: {
                  type: "string",
                  enum: ["FAIL", "WARN"],
                },
                ValidationName: {
                  type: "string",
                },
                ValidationStatus: {
                  type: "string",
                  enum: ["FAILED", "SKIPPED"],
                },
                ValidationStatusReason: {
                  type: "string",
                },
                ValidationPath: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of operation events that match the specified criteria.",
          },
          NextToken: {
            type: "string",
            description:
              "If the request doesn't return all the remaining results, NextToken is set to a token.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeEvents;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeStackResources: AppBlock = {
  name: "Describe Stack Resources",
  description: `Returns Amazon Web Services resource descriptions for running and deleted stacks.`,
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
            "The name or the unique stack ID that is associated with the stack, which aren't always interchangeable: Running stacks: You can specify either the stack's name or its unique stack ID.",
          type: "string",
          required: false,
        },
        LogicalResourceId: {
          name: "Logical Resource Id",
          description:
            "The logical name of the resource as specified in the template.",
          type: "string",
          required: false,
        },
        PhysicalResourceId: {
          name: "Physical Resource Id",
          description:
            "The name or unique identifier that corresponds to a physical instance ID of a resource supported by CloudFormation.",
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

        const command = new DescribeStackResourcesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Stack Resources Result",
      description: "Result from DescribeStackResources operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StackResources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                StackName: {
                  type: "string",
                },
                StackId: {
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
                Timestamp: {
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
                Description: {
                  type: "string",
                },
                DriftInformation: {
                  type: "object",
                  properties: {
                    StackResourceDriftStatus: {
                      type: "string",
                      enum: [
                        "IN_SYNC",
                        "MODIFIED",
                        "DELETED",
                        "NOT_CHECKED",
                        "UNKNOWN",
                        "UNSUPPORTED",
                      ],
                    },
                    LastCheckTimestamp: {
                      type: "string",
                    },
                  },
                  required: ["StackResourceDriftStatus"],
                  additionalProperties: false,
                },
                ModuleInfo: {
                  type: "object",
                  properties: {
                    TypeHierarchy: {
                      type: "string",
                    },
                    LogicalIdHierarchy: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: [
                "LogicalResourceId",
                "ResourceType",
                "Timestamp",
                "ResourceStatus",
              ],
              additionalProperties: false,
            },
            description: "A list of StackResource structures.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeStackResources;

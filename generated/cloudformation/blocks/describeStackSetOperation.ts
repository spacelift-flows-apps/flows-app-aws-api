import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DescribeStackSetOperationCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeStackSetOperation: AppBlock = {
  name: "Describe Stack Set Operation",
  description: `Returns the description of the specified StackSet operation.`,
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
        StackSetName: {
          name: "Stack Set Name",
          description:
            "The name or the unique stack ID of the stack set for the stack operation.",
          type: "string",
          required: true,
        },
        OperationId: {
          name: "Operation Id",
          description: "The unique ID of the stack set operation.",
          type: "string",
          required: true,
        },
        CallAs: {
          name: "Call As",
          description:
            "[Service-managed permissions] Specifies whether you are acting as an account administrator in the organization's management account or as a delegated administrator in a member account.",
          type: "string",
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

        const command = new DescribeStackSetOperationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Stack Set Operation Result",
      description: "Result from DescribeStackSetOperation operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StackSetOperation: {
            type: "object",
            properties: {
              OperationId: {
                type: "string",
              },
              StackSetId: {
                type: "string",
              },
              Action: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              OperationPreferences: {
                type: "object",
                properties: {
                  RegionConcurrencyType: {
                    type: "string",
                  },
                  RegionOrder: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  FailureToleranceCount: {
                    type: "number",
                  },
                  FailureTolerancePercentage: {
                    type: "number",
                  },
                  MaxConcurrentCount: {
                    type: "number",
                  },
                  MaxConcurrentPercentage: {
                    type: "number",
                  },
                  ConcurrencyMode: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              RetainStacks: {
                type: "boolean",
              },
              AdministrationRoleARN: {
                type: "string",
              },
              ExecutionRoleName: {
                type: "string",
              },
              CreationTimestamp: {
                type: "string",
              },
              EndTimestamp: {
                type: "string",
              },
              DeploymentTargets: {
                type: "object",
                properties: {
                  Accounts: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  AccountsUrl: {
                    type: "string",
                  },
                  OrganizationalUnitIds: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  AccountFilterType: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              StackSetDriftDetectionDetails: {
                type: "object",
                properties: {
                  DriftStatus: {
                    type: "string",
                  },
                  DriftDetectionStatus: {
                    type: "string",
                  },
                  LastDriftCheckTimestamp: {
                    type: "string",
                  },
                  TotalStackInstancesCount: {
                    type: "number",
                  },
                  DriftedStackInstancesCount: {
                    type: "number",
                  },
                  InSyncStackInstancesCount: {
                    type: "number",
                  },
                  InProgressStackInstancesCount: {
                    type: "number",
                  },
                  FailedStackInstancesCount: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              StatusReason: {
                type: "string",
              },
              StatusDetails: {
                type: "object",
                properties: {
                  FailedStackInstancesCount: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "The specified stack set operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeStackSetOperation;

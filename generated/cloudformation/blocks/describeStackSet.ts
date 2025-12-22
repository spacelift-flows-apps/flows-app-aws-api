import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DescribeStackSetCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeStackSet: AppBlock = {
  name: "Describe Stack Set",
  description: `Returns the description of the specified StackSet.`,
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
            "The name or unique ID of the stack set whose description you want.",
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

        const command = new DescribeStackSetCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Stack Set Result",
      description: "Result from DescribeStackSet operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StackSet: {
            type: "object",
            properties: {
              StackSetName: {
                type: "string",
              },
              StackSetId: {
                type: "string",
              },
              Description: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              TemplateBody: {
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
              Capabilities: {
                type: "array",
                items: {
                  type: "string",
                },
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
              StackSetARN: {
                type: "string",
              },
              AdministrationRoleARN: {
                type: "string",
              },
              ExecutionRoleName: {
                type: "string",
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
              AutoDeployment: {
                type: "object",
                properties: {
                  Enabled: {
                    type: "boolean",
                  },
                  RetainStacksOnAccountRemoval: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              PermissionModel: {
                type: "string",
              },
              OrganizationalUnitIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              ManagedExecution: {
                type: "object",
                properties: {
                  Active: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              Regions: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
            description: "The specified stack set.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeStackSet;

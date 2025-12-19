import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  UpdateStackInstancesCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateStackInstances: AppBlock = {
  name: "Update Stack Instances",
  description: `Updates the parameter values for stack instances for the specified accounts, within the specified Amazon Web Services Regions.`,
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
            "The name or unique ID of the stack set associated with the stack instances.",
          type: "string",
          required: true,
        },
        Accounts: {
          name: "Accounts",
          description:
            "[Self-managed permissions] The account IDs of one or more Amazon Web Services accounts for which you want to update parameter values for stack instances.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        DeploymentTargets: {
          name: "Deployment Targets",
          description:
            "[Service-managed permissions] The Organizations accounts for which you want to update parameter values for stack instances.",
          type: {
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
          required: false,
        },
        Regions: {
          name: "Regions",
          description:
            "The names of one or more Amazon Web Services Regions in which you want to update parameter values for stack instances.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        ParameterOverrides: {
          name: "Parameter Overrides",
          description:
            "A list of input parameters whose values you want to update for the specified stack instances.",
          type: {
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
          required: false,
        },
        OperationPreferences: {
          name: "Operation Preferences",
          description:
            "Preferences for how CloudFormation performs this stack set operation.",
          type: {
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
          required: false,
        },
        OperationId: {
          name: "Operation Id",
          description: "The unique identifier for this stack set operation.",
          type: "string",
          required: false,
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

        const command = new UpdateStackInstancesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Stack Instances Result",
      description: "Result from UpdateStackInstances operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          OperationId: {
            type: "string",
            description: "The unique identifier for this stack set operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateStackInstances;

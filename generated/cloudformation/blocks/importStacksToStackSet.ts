import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  ImportStacksToStackSetCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const importStacksToStackSet: AppBlock = {
  name: "Import Stacks To Stack Set",
  description: `Import existing stacks into a new stack sets.`,
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
          description: "The name of the stack set.",
          type: "string",
          required: true,
        },
        StackIds: {
          name: "Stack Ids",
          description:
            "The IDs of the stacks you are importing into a stack set.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        StackIdsUrl: {
          name: "Stack Ids Url",
          description:
            "The Amazon S3 URL which contains list of stack ids to be inputted.",
          type: "string",
          required: false,
        },
        OrganizationalUnitIds: {
          name: "Organizational Unit Ids",
          description:
            "The list of OU ID's to which the stacks being imported has to be mapped as deployment target.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        OperationPreferences: {
          name: "Operation Preferences",
          description:
            "The user-specified preferences for how CloudFormation performs a stack set operation.",
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
          description:
            "A unique, user defined, identifier for the stack set operation.",
          type: "string",
          required: false,
        },
        CallAs: {
          name: "Call As",
          description: "By default, SELF is specified.",
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

        const command = new ImportStacksToStackSetCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Import Stacks To Stack Set Result",
      description: "Result from ImportStacksToStackSet operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          OperationId: {
            type: "string",
            description: "The unique identifier for the stack set operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default importStacksToStackSet;

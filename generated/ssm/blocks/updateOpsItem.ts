import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, UpdateOpsItemCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateOpsItem: AppBlock = {
  name: "Update Ops Item",
  description: `Edit or change an OpsItem.`,
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
        Description: {
          name: "Description",
          description:
            "User-defined text that contains information about the OpsItem, in Markdown format.",
          type: "string",
          required: false,
        },
        OperationalData: {
          name: "Operational Data",
          description:
            "Add new keys or edit existing key-value pairs of the OperationalData map in the OpsItem object.",
          type: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
          },
          required: false,
        },
        OperationalDataToDelete: {
          name: "Operational Data To Delete",
          description:
            "Keys that you want to remove from the OperationalData map.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Notifications: {
          name: "Notifications",
          description:
            "The Amazon Resource Name (ARN) of an SNS topic where notifications are sent when this OpsItem is edited or changed.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Arn: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        Priority: {
          name: "Priority",
          description:
            "The importance of this OpsItem in relation to other OpsItems in the system.",
          type: "number",
          required: false,
        },
        RelatedOpsItems: {
          name: "Related Ops Items",
          description:
            "One or more OpsItems that share something in common with the current OpsItems.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                OpsItemId: {
                  type: "string",
                },
              },
              required: ["OpsItemId"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Status: {
          name: "Status",
          description: "The OpsItem status.",
          type: "string",
          required: false,
        },
        OpsItemId: {
          name: "Ops Item Id",
          description: "The ID of the OpsItem.",
          type: "string",
          required: true,
        },
        Title: {
          name: "Title",
          description:
            "A short heading that describes the nature of the OpsItem and the impacted resource.",
          type: "string",
          required: false,
        },
        Category: {
          name: "Category",
          description: "Specify a new category for an OpsItem.",
          type: "string",
          required: false,
        },
        Severity: {
          name: "Severity",
          description: "Specify a new severity for an OpsItem.",
          type: "string",
          required: false,
        },
        ActualStartTime: {
          name: "Actual Start Time",
          description: "The time a runbook workflow started.",
          type: "string",
          required: false,
        },
        ActualEndTime: {
          name: "Actual End Time",
          description: "The time a runbook workflow ended.",
          type: "string",
          required: false,
        },
        PlannedStartTime: {
          name: "Planned Start Time",
          description:
            "The time specified in a change request for a runbook workflow to start.",
          type: "string",
          required: false,
        },
        PlannedEndTime: {
          name: "Planned End Time",
          description:
            "The time specified in a change request for a runbook workflow to end.",
          type: "string",
          required: false,
        },
        OpsItemArn: {
          name: "Ops Item Arn",
          description: "The OpsItem Amazon Resource Name (ARN).",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateOpsItemCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Ops Item Result",
      description: "Result from UpdateOpsItem operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default updateOpsItem;

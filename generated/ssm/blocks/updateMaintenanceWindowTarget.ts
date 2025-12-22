import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  UpdateMaintenanceWindowTargetCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateMaintenanceWindowTarget: AppBlock = {
  name: "Update Maintenance Window Target",
  description: `Modifies the target of an existing maintenance window.`,
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
        WindowId: {
          name: "Window Id",
          description:
            "The maintenance window ID with which to modify the target.",
          type: "string",
          required: true,
        },
        WindowTargetId: {
          name: "Window Target Id",
          description: "The target ID to modify.",
          type: "string",
          required: true,
        },
        Targets: {
          name: "Targets",
          description: "The targets to add or replace.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        OwnerInformation: {
          name: "Owner Information",
          description:
            "User-provided value that will be included in any Amazon CloudWatch Events events raised while running tasks for these targets in this maintenance window.",
          type: "string",
          required: false,
        },
        Name: {
          name: "Name",
          description: "A name for the update.",
          type: "string",
          required: false,
        },
        Description: {
          name: "Description",
          description: "An optional description for the update.",
          type: "string",
          required: false,
        },
        Replace: {
          name: "Replace",
          description:
            "If True, then all fields that are required by the RegisterTargetWithMaintenanceWindow operation are also required for this API request.",
          type: "boolean",
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
        }

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateMaintenanceWindowTargetCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Maintenance Window Target Result",
      description: "Result from UpdateMaintenanceWindowTarget operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          WindowId: {
            type: "string",
            description:
              "The maintenance window ID specified in the update request.",
          },
          WindowTargetId: {
            type: "string",
            description: "The target ID specified in the update request.",
          },
          Targets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description: "The updated targets.",
          },
          OwnerInformation: {
            type: "string",
            description: "The updated owner.",
          },
          Name: {
            type: "string",
            description: "The updated name.",
          },
          Description: {
            type: "string",
            description: "The updated description.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateMaintenanceWindowTarget;

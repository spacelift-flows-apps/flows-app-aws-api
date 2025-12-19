import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  ApplyPendingMaintenanceActionCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const applyPendingMaintenanceAction: AppBlock = {
  name: "Apply Pending Maintenance Action",
  description: `Applies a pending maintenance action to a resource (for example, to a DB instance).`,
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
        ResourceIdentifier: {
          name: "Resource Identifier",
          description:
            "The RDS Amazon Resource Name (ARN) of the resource that the pending maintenance action applies to.",
          type: "string",
          required: true,
        },
        ApplyAction: {
          name: "Apply Action",
          description:
            "The pending maintenance action to apply to this resource.",
          type: "string",
          required: true,
        },
        OptInType: {
          name: "Opt In Type",
          description:
            "A value that specifies the type of opt-in request, or undoes an opt-in request.",
          type: "string",
          required: true,
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ApplyPendingMaintenanceActionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Apply Pending Maintenance Action Result",
      description: "Result from ApplyPendingMaintenanceAction operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ResourcePendingMaintenanceActions: {
            type: "object",
            properties: {
              ResourceIdentifier: {
                type: "string",
              },
              PendingMaintenanceActionDetails: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Action: {
                      type: "string",
                    },
                    AutoAppliedAfterDate: {
                      type: "string",
                    },
                    ForcedApplyDate: {
                      type: "string",
                    },
                    OptInStatus: {
                      type: "string",
                    },
                    CurrentApplyDate: {
                      type: "string",
                    },
                    Description: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description:
              "Describes the pending maintenance actions for a resource.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default applyPendingMaintenanceAction;

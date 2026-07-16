import { AppBlock, events } from "@slflows/sdk/v1";
import {
  OrganizationsClient,
  UpdateResponsibilityTransferCommand,
} from "@aws-sdk/client-organizations";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateResponsibilityTransfer: AppBlock = {
  name: "Update Responsibility Transfer",
  description: `Updates a transfer.`,
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
        Id: {
          name: "Id",
          description: "ID for the transfer.",
          type: "string",
          required: true,
        },
        Name: {
          name: "Name",
          description: "New name you want to assign to the transfer.",
          type: "string",
          required: true,
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

        const client = new OrganizationsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateResponsibilityTransferCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Responsibility Transfer Result",
      description: "Result from UpdateResponsibilityTransfer operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ResponsibilityTransfer: {
            type: "object",
            properties: {
              Arn: {
                type: "string",
              },
              Name: {
                type: "string",
              },
              Id: {
                type: "string",
              },
              Type: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              Source: {
                type: "object",
                properties: {
                  ManagementAccountId: {
                    type: "string",
                  },
                  ManagementAccountEmail: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              Target: {
                type: "object",
                properties: {
                  ManagementAccountId: {
                    type: "string",
                  },
                  ManagementAccountEmail: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              StartTimestamp: {
                type: "string",
              },
              EndTimestamp: {
                type: "string",
              },
              ActiveHandshakeId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Contains details for a transfer.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateResponsibilityTransfer;

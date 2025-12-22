import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  ModifyDocumentPermissionCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyDocumentPermission: AppBlock = {
  name: "Modify Document Permission",
  description: `Shares a Amazon Web Services Systems Manager document (SSM document)publicly or privately.`,
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
        Name: {
          name: "Name",
          description: "The name of the document that you want to share.",
          type: "string",
          required: true,
        },
        PermissionType: {
          name: "Permission Type",
          description: "The permission type for the document.",
          type: "string",
          required: true,
        },
        AccountIdsToAdd: {
          name: "Account Ids To Add",
          description:
            "The Amazon Web Services users that should have access to the document.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AccountIdsToRemove: {
          name: "Account Ids To Remove",
          description:
            "The Amazon Web Services users that should no longer have access to the document.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        SharedDocumentVersion: {
          name: "Shared Document Version",
          description: "(Optional) The version of the document to share.",
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

        const command = new ModifyDocumentPermissionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Document Permission Result",
      description: "Result from ModifyDocumentPermission operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default modifyDocumentPermission;

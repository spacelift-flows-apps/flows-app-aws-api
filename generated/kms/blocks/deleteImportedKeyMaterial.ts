import { AppBlock, events } from "@slflows/sdk/v1";
import {
  KMSClient,
  DeleteImportedKeyMaterialCommand,
} from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteImportedKeyMaterial: AppBlock = {
  name: "Delete Imported Key Material",
  description: `Deletes key material that was previously imported.`,
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
        KeyId: {
          name: "Key Id",
          description:
            "Identifies the KMS key from which you are deleting imported key material.",
          type: "string",
          required: true,
        },
        KeyMaterialId: {
          name: "Key Material Id",
          description: "Identifies the imported key material you are deleting.",
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

        const client = new KMSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeleteImportedKeyMaterialCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Imported Key Material Result",
      description: "Result from DeleteImportedKeyMaterial operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          KeyId: {
            type: "string",
            description:
              "The Amazon Resource Name (key ARN) of the KMS key from which the key material was deleted.",
          },
          KeyMaterialId: {
            type: "string",
            description: "Identifies the deleted key material.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteImportedKeyMaterial;

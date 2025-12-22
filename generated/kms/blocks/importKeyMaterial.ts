import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, ImportKeyMaterialCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const importKeyMaterial: AppBlock = {
  name: "Import Key Material",
  description: `Imports or reimports key material into an existing KMS key that was created without key material.`,
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
            "The identifier of the KMS key that will be associated with the imported key material.",
          type: "string",
          required: true,
        },
        ImportToken: {
          name: "Import Token",
          description:
            "The import token that you received in the response to a previous GetParametersForImport request.",
          type: "string",
          required: true,
        },
        EncryptedKeyMaterial: {
          name: "Encrypted Key Material",
          description: "The encrypted key material to import.",
          type: "string",
          required: true,
        },
        ValidTo: {
          name: "Valid To",
          description:
            "The date and time when the imported key material expires.",
          type: "string",
          required: false,
        },
        ExpirationModel: {
          name: "Expiration Model",
          description: "Specifies whether the key material expires.",
          type: "string",
          required: false,
        },
        ImportType: {
          name: "Import Type",
          description:
            "Indicates whether the key material being imported is previously associated with this KMS key or not.",
          type: "string",
          required: false,
        },
        KeyMaterialDescription: {
          name: "Key Material Description",
          description: "Description for the key material being imported.",
          type: "string",
          required: false,
        },
        KeyMaterialId: {
          name: "Key Material Id",
          description: "Identifies the key material being imported.",
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

        const client = new KMSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ImportKeyMaterialCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Import Key Material Result",
      description: "Result from ImportKeyMaterial operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          KeyId: {
            type: "string",
            description:
              "The Amazon Resource Name (key ARN) of the KMS key into which key material was imported.",
          },
          KeyMaterialId: {
            type: "string",
            description: "Identifies the imported key material.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default importKeyMaterial;

import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, GetParametersForImportCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getParametersForImport: AppBlock = {
  name: "Get Parameters For Import",
  description: `Returns the public key and an import token you need to import or reimport key material for a KMS key.`,
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
        WrappingAlgorithm: {
          name: "Wrapping Algorithm",
          description:
            "The algorithm you will use with the RSA public key (PublicKey) in the response to protect your key material during import.",
          type: "string",
          required: true,
        },
        WrappingKeySpec: {
          name: "Wrapping Key Spec",
          description: "The type of RSA public key to return in the response.",
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

        const client = new KMSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetParametersForImportCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Parameters For Import Result",
      description: "Result from GetParametersForImport operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          KeyId: {
            type: "string",
            description:
              "The Amazon Resource Name (key ARN) of the KMS key to use in a subsequent ImportKeyMaterial request.",
          },
          ImportToken: {
            type: "string",
            description:
              "The import token to send in a subsequent ImportKeyMaterial request.",
          },
          PublicKey: {
            type: "string",
            description:
              "The public key to use to encrypt the key material before importing it with ImportKeyMaterial.",
          },
          ParametersValidTo: {
            type: "string",
            description:
              "The time at which the import token and public key are no longer valid.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getParametersForImport;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  KMSClient,
  GenerateDataKeyWithoutPlaintextCommand,
} from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const generateDataKeyWithoutPlaintext: AppBlock = {
  name: "Generate Data Key Without Plaintext",
  description: `Returns a unique symmetric data key for use outside of KMS.`,
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
            "Specifies the symmetric encryption KMS key that encrypts the data key.",
          type: "string",
          required: true,
        },
        EncryptionContext: {
          name: "Encryption Context",
          description:
            "Specifies the encryption context that will be used when encrypting the data key.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        KeySpec: {
          name: "Key Spec",
          description: "The length of the data key.",
          type: "string",
          required: false,
        },
        NumberOfBytes: {
          name: "Number Of Bytes",
          description: "The length of the data key in bytes.",
          type: "number",
          required: false,
        },
        GrantTokens: {
          name: "Grant Tokens",
          description: "A list of grant tokens.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description: "Checks if your request will succeed.",
          type: "boolean",
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

        const command = new GenerateDataKeyWithoutPlaintextCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Generate Data Key Without Plaintext Result",
      description: "Result from GenerateDataKeyWithoutPlaintext operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CiphertextBlob: {
            type: "string",
            description: "The encrypted data key.",
          },
          KeyId: {
            type: "string",
            description:
              "The Amazon Resource Name (key ARN) of the KMS key that encrypted the data key.",
          },
          KeyMaterialId: {
            type: "string",
            description:
              "The identifier of the key material used to encrypt the data key.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default generateDataKeyWithoutPlaintext;

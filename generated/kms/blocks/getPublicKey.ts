import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, GetPublicKeyCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getPublicKey: AppBlock = {
  name: "Get Public Key",
  description: `Returns the public key of an asymmetric KMS key.`,
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
            "Identifies the asymmetric KMS key that includes the public key.",
          type: "string",
          required: true,
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

        const command = new GetPublicKeyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Public Key Result",
      description: "Result from GetPublicKey operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          KeyId: {
            type: "string",
            description:
              "The Amazon Resource Name (key ARN) of the asymmetric KMS key from which the public key was downloaded.",
          },
          PublicKey: {
            type: "string",
            description: "The exported public key.",
          },
          CustomerMasterKeySpec: {
            type: "string",
            description:
              "Instead, use the KeySpec field in the GetPublicKey response.",
          },
          KeySpec: {
            type: "string",
            description:
              "The type of the of the public key that was downloaded.",
          },
          KeyUsage: {
            type: "string",
            description: "The permitted use of the public key.",
          },
          EncryptionAlgorithms: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The encryption algorithms that KMS supports for this key.",
          },
          SigningAlgorithms: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The signing algorithms that KMS supports for this key.",
          },
          KeyAgreementAlgorithms: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The key agreement algorithm used to derive a shared secret.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getPublicKey;

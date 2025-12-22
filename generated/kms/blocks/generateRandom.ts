import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, GenerateRandomCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const generateRandom: AppBlock = {
  name: "Generate Random",
  description: `Returns a random byte string that is cryptographically secure.`,
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
        NumberOfBytes: {
          name: "Number Of Bytes",
          description: "The length of the random byte string.",
          type: "number",
          required: false,
        },
        CustomKeyStoreId: {
          name: "Custom Key Store Id",
          description:
            "Generates the random byte string in the CloudHSM cluster that is associated with the specified CloudHSM key store.",
          type: "string",
          required: false,
        },
        Recipient: {
          name: "Recipient",
          description:
            "A signed attestation document from an Amazon Web Services Nitro enclave and the encryption algorithm to use with the enclave's public key.",
          type: {
            type: "object",
            properties: {
              KeyEncryptionAlgorithm: {
                type: "string",
              },
              AttestationDocument: {
                type: "string",
              },
            },
            additionalProperties: false,
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

        const command = new GenerateRandomCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Generate Random Result",
      description: "Result from GenerateRandom operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Plaintext: {
            type: "string",
            description: "The random byte string.",
          },
          CiphertextForRecipient: {
            type: "string",
            description:
              "The plaintext random bytes encrypted with the public key from the Nitro enclave.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default generateRandom;

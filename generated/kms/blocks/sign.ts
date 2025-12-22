import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const sign: AppBlock = {
  name: "Sign",
  description: `Creates a digital signature for a message or message digest by using the private key in an asymmetric signing KMS key.`,
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
          description: "Identifies an asymmetric KMS key.",
          type: "string",
          required: true,
        },
        Message: {
          name: "Message",
          description: "Specifies the message or message digest to sign.",
          type: "string",
          required: true,
        },
        MessageType: {
          name: "Message Type",
          description:
            "Tells KMS whether the value of the Message parameter should be hashed as part of the signing algorithm.",
          type: "string",
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
        SigningAlgorithm: {
          name: "Signing Algorithm",
          description:
            "Specifies the signing algorithm to use when signing the message.",
          type: "string",
          required: true,
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

        const command = new SignCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Sign Result",
      description: "Result from Sign operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          KeyId: {
            type: "string",
            description:
              "The Amazon Resource Name (key ARN) of the asymmetric KMS key that was used to sign the message.",
          },
          Signature: {
            type: "string",
            description:
              "The cryptographic signature that was generated for the message.",
          },
          SigningAlgorithm: {
            type: "string",
            description:
              "The signing algorithm that was used to sign the message.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default sign;

import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, GenerateMacCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const generateMac: AppBlock = {
  name: "Generate Mac",
  description: `Generates a hash-based message authentication code (HMAC) for a message using an HMAC KMS key and a MAC algorithm that the key supports.`,
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
        Message: {
          name: "Message",
          description: "The message to be hashed.",
          type: "string",
          required: true,
        },
        KeyId: {
          name: "Key Id",
          description: "The HMAC KMS key to use in the operation.",
          type: "string",
          required: true,
        },
        MacAlgorithm: {
          name: "Mac Algorithm",
          description: "The MAC algorithm used in the operation.",
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

        const command = new GenerateMacCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Generate Mac Result",
      description: "Result from GenerateMac operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Mac: {
            type: "string",
            description:
              "The hash-based message authentication code (HMAC) that was generated for the specified message, HMAC KMS key, and MAC algorithm.",
          },
          MacAlgorithm: {
            type: "string",
            description:
              "The MAC algorithm that was used to generate the HMAC.",
          },
          KeyId: {
            type: "string",
            description: "The HMAC KMS key used in the operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default generateMac;

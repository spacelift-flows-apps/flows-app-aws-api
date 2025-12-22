import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, VerifyMacCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const verifyMac: AppBlock = {
  name: "Verify Mac",
  description: `Verifies the hash-based message authentication code (HMAC) for a specified message, HMAC KMS key, and MAC algorithm.`,
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
          description: "The message that will be used in the verification.",
          type: "string",
          required: true,
        },
        KeyId: {
          name: "Key Id",
          description: "The KMS key that will be used in the verification.",
          type: "string",
          required: true,
        },
        MacAlgorithm: {
          name: "Mac Algorithm",
          description:
            "The MAC algorithm that will be used in the verification.",
          type: "string",
          required: true,
        },
        Mac: {
          name: "Mac",
          description: "The HMAC to verify.",
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

        const command = new VerifyMacCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Verify Mac Result",
      description: "Result from VerifyMac operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          KeyId: {
            type: "string",
            description: "The HMAC KMS key used in the verification.",
          },
          MacValid: {
            type: "boolean",
            description:
              "A Boolean value that indicates whether the HMAC was verified.",
          },
          MacAlgorithm: {
            type: "string",
            description: "The MAC algorithm used in the verification.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default verifyMac;

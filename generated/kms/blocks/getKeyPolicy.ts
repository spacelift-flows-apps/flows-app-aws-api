import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, GetKeyPolicyCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getKeyPolicy: AppBlock = {
  name: "Get Key Policy",
  description: `Gets a key policy attached to the specified KMS key.`,
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
          description: "Gets the key policy for the specified KMS key.",
          type: "string",
          required: true,
        },
        PolicyName: {
          name: "Policy Name",
          description: "Specifies the name of the key policy.",
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

        const command = new GetKeyPolicyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Key Policy Result",
      description: "Result from GetKeyPolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Policy: {
            type: "string",
            description: "A key policy document in JSON format.",
          },
          PolicyName: {
            type: "string",
            description: "The name of the key policy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getKeyPolicy;

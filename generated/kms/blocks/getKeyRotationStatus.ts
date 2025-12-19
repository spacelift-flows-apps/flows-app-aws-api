import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, GetKeyRotationStatusCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getKeyRotationStatus: AppBlock = {
  name: "Get Key Rotation Status",
  description: `Provides detailed information about the rotation status for a KMS key, including whether automatic rotation of the key material is enabled for the specified KMS key, the rotation period, and the next scheduled rotation date.`,
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
          description: "Gets the rotation status for the specified KMS key.",
          type: "string",
          required: true,
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

        const command = new GetKeyRotationStatusCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Key Rotation Status Result",
      description: "Result from GetKeyRotationStatus operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          KeyRotationEnabled: {
            type: "boolean",
            description:
              "A Boolean value that specifies whether key rotation is enabled.",
          },
          KeyId: {
            type: "string",
            description:
              "Identifies the specified symmetric encryption KMS key.",
          },
          RotationPeriodInDays: {
            type: "number",
            description: "The number of days between each automatic rotation.",
          },
          NextRotationDate: {
            type: "string",
            description:
              "The next date that KMS will automatically rotate the key material.",
          },
          OnDemandRotationStartDate: {
            type: "string",
            description:
              "Identifies the date and time that an in progress on-demand rotation was initiated.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getKeyRotationStatus;

import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, ScheduleKeyDeletionCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const scheduleKeyDeletion: AppBlock = {
  name: "Schedule Key Deletion",
  description: `Schedules the deletion of a KMS key.`,
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
          description: "The unique identifier of the KMS key to delete.",
          type: "string",
          required: true,
        },
        PendingWindowInDays: {
          name: "Pending Window In Days",
          description: "The waiting period, specified in number of days.",
          type: "number",
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

        const command = new ScheduleKeyDeletionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Schedule Key Deletion Result",
      description: "Result from ScheduleKeyDeletion operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          KeyId: {
            type: "string",
            description:
              "The Amazon Resource Name (key ARN) of the KMS key whose deletion is scheduled.",
          },
          DeletionDate: {
            type: "string",
            description:
              "The date and time after which KMS deletes the KMS key.",
          },
          KeyState: {
            type: "string",
            description: "The current status of the KMS key.",
          },
          PendingWindowInDays: {
            type: "number",
            description: "The waiting period before the KMS key is deleted.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default scheduleKeyDeletion;

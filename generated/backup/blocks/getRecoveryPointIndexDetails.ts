import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  GetRecoveryPointIndexDetailsCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getRecoveryPointIndexDetails: AppBlock = {
  name: "Get Recovery Point Index Details",
  description: `This operation returns the metadata and details specific to the backup index associated with the specified recovery point.`,
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
        BackupVaultName: {
          name: "Backup Vault Name",
          description:
            "The name of a logical container where backups are stored.",
          type: "string",
          required: true,
        },
        RecoveryPointArn: {
          name: "Recovery Point Arn",
          description:
            "An ARN that uniquely identifies a recovery point; for example, arn:aws:backup:us-east-1:123456789012:recovery-point:1EB3B5E7-9EB0-435A-A80B-108B488B0D45.",
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

        const client = new BackupClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetRecoveryPointIndexDetailsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Recovery Point Index Details Result",
      description: "Result from GetRecoveryPointIndexDetails operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RecoveryPointArn: {
            type: "string",
            description:
              "An ARN that uniquely identifies a recovery point; for example, arn:aws:backup:us-east-1:123456789012:recovery-point:1EB3B5E7-9EB0-435A-A80B-108B488B0D45.",
          },
          BackupVaultArn: {
            type: "string",
            description:
              "An ARN that uniquely identifies the backup vault where the recovery point index is stored.",
          },
          SourceResourceArn: {
            type: "string",
            description:
              "A string of the Amazon Resource Name (ARN) that uniquely identifies the source resource.",
          },
          IndexCreationDate: {
            type: "string",
            description:
              "The date and time that a backup index was created, in Unix format and Coordinated Universal Time (UTC).",
          },
          IndexDeletionDate: {
            type: "string",
            description:
              "The date and time that a backup index was deleted, in Unix format and Coordinated Universal Time (UTC).",
          },
          IndexCompletionDate: {
            type: "string",
            description:
              "The date and time that a backup index finished creation, in Unix format and Coordinated Universal Time (UTC).",
          },
          IndexStatus: {
            type: "string",
            description:
              "This is the current status for the backup index associated with the specified recovery point.",
          },
          IndexStatusMessage: {
            type: "string",
            description:
              "A detailed message explaining the status of a backup index associated with the recovery point.",
          },
          TotalItemsIndexed: {
            type: "number",
            description:
              "Count of items within the backup index associated with the recovery point.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getRecoveryPointIndexDetails;

import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, StartRestoreJobCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startRestoreJob: AppBlock = {
  name: "Start Restore Job",
  description: `Recovers the saved resource identified by an Amazon Resource Name (ARN).`,
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
        RecoveryPointArn: {
          name: "Recovery Point Arn",
          description:
            "An ARN that uniquely identifies a recovery point; for example, arn:aws:backup:us-east-1:123456789012:recovery-point:1EB3B5E7-9EB0-435A-A80B-108B488B0D45.",
          type: "string",
          required: true,
        },
        Metadata: {
          name: "Metadata",
          description: "A set of metadata key-value pairs.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: true,
        },
        IamRoleArn: {
          name: "Iam Role Arn",
          description:
            "The Amazon Resource Name (ARN) of the IAM role that Backup uses to create the target resource; for example: arn:aws:iam::123456789012:role/S3Access.",
          type: "string",
          required: false,
        },
        IdempotencyToken: {
          name: "Idempotency Token",
          description:
            "A customer-chosen string that you can use to distinguish between otherwise identical calls to StartRestoreJob.",
          type: "string",
          required: false,
        },
        ResourceType: {
          name: "Resource Type",
          description:
            "Starts a job to restore a recovery point for one of the following resources: Aurora - Amazon Aurora ...",
          type: "string",
          required: false,
        },
        CopySourceTagsToRestoredResource: {
          name: "Copy Source Tags To Restored Resource",
          description: "This is an optional parameter.",
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

        const client = new BackupClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new StartRestoreJobCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Restore Job Result",
      description: "Result from StartRestoreJob operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RestoreJobId: {
            type: "string",
            description:
              "Uniquely identifies the job that restores a recovery point.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startRestoreJob;

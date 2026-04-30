import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  DescribeRestoreJobCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeRestoreJob: AppBlock = {
  name: "Describe Restore Job",
  description: `Returns metadata associated with a restore job that is specified by a job ID.`,
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
        RestoreJobId: {
          name: "Restore Job Id",
          description:
            "Uniquely identifies the job that restores a recovery point.",
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

        const command = new DescribeRestoreJobCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Restore Job Result",
      description: "Result from DescribeRestoreJob operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AccountId: {
            type: "string",
            description: "Returns the account ID that owns the restore job.",
          },
          RestoreJobId: {
            type: "string",
            description:
              "Uniquely identifies the job that restores a recovery point.",
          },
          RecoveryPointArn: {
            type: "string",
            description:
              "An ARN that uniquely identifies a recovery point; for example, arn:aws:backup:us-east-1:123456789012:recovery-point:1EB3B5E7-9EB0-435A-A80B-108B488B0D45.",
          },
          SourceResourceArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the original resource that was backed up.",
          },
          BackupVaultArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the backup vault containing the recovery point being restored.",
          },
          CreationDate: {
            type: "string",
            description:
              "The date and time that a restore job is created, in Unix format and Coordinated Universal Time (UTC).",
          },
          CompletionDate: {
            type: "string",
            description:
              "The date and time that a job to restore a recovery point is completed, in Unix format and Coordinated Universal Time (UTC).",
          },
          Status: {
            type: "string",
            description:
              "Status code specifying the state of the job that is initiated by Backup to restore a recovery point.",
          },
          StatusMessage: {
            type: "string",
            description:
              "A message showing the status of a job to restore a recovery point.",
          },
          PercentDone: {
            type: "string",
            description:
              "Contains an estimated percentage that is complete of a job at the time the job status was queried.",
          },
          BackupSizeInBytes: {
            type: "number",
            description: "The size, in bytes, of the restored resource.",
          },
          IamRoleArn: {
            type: "string",
            description:
              "Specifies the IAM role ARN used to create the target recovery point; for example, arn:aws:iam::123456789012:role/S3Access.",
          },
          ExpectedCompletionTimeMinutes: {
            type: "number",
            description:
              "The amount of time in minutes that a job restoring a recovery point is expected to take.",
          },
          CreatedResourceArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the resource that was created by the restore job.",
          },
          ResourceType: {
            type: "string",
            description:
              "Returns metadata associated with a restore job listed by resource type.",
          },
          RecoveryPointCreationDate: {
            type: "string",
            description:
              "The creation date of the recovery point made by the specifed restore job.",
          },
          CreatedBy: {
            type: "object",
            properties: {
              RestoreTestingPlanArn: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Contains identifying information about the creation of a restore job.",
          },
          ValidationStatus: {
            type: "string",
            description:
              "The status of validation run on the indicated restore job.",
          },
          ValidationStatusMessage: {
            type: "string",
            description: "The status message.",
          },
          DeletionStatus: {
            type: "string",
            description:
              "The status of the data generated by the restore test.",
          },
          DeletionStatusMessage: {
            type: "string",
            description: "This describes the restore job deletion status.",
          },
          IsParent: {
            type: "boolean",
            description:
              "This is a boolean value indicating whether the restore job is a parent (composite) restore job.",
          },
          ParentJobId: {
            type: "string",
            description:
              "This is the unique identifier of the parent restore job for the selected restore job.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeRestoreJob;

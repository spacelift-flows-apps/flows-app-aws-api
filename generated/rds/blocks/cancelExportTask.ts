import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, CancelExportTaskCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const cancelExportTask: AppBlock = {
  name: "Cancel Export Task",
  description: `Cancels an export task in progress that is exporting a snapshot or cluster to Amazon S3.`,
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
        ExportTaskIdentifier: {
          name: "Export Task Identifier",
          description:
            "The identifier of the snapshot or cluster export task to cancel.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CancelExportTaskCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Cancel Export Task Result",
      description: "Result from CancelExportTask operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ExportTaskIdentifier: {
            type: "string",
            description:
              "A unique identifier for the snapshot or cluster export task.",
          },
          SourceArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the snapshot or cluster exported to Amazon S3.",
          },
          ExportOnly: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The data exported from the snapshot or cluster.",
          },
          SnapshotTime: {
            type: "string",
            description: "The time when the snapshot was created.",
          },
          TaskStartTime: {
            type: "string",
            description:
              "The time when the snapshot or cluster export task started.",
          },
          TaskEndTime: {
            type: "string",
            description:
              "The time when the snapshot or cluster export task ended.",
          },
          S3Bucket: {
            type: "string",
            description:
              "The Amazon S3 bucket where the snapshot or cluster is exported to.",
          },
          S3Prefix: {
            type: "string",
            description:
              "The Amazon S3 bucket prefix that is the file name and path of the exported data.",
          },
          IamRoleArn: {
            type: "string",
            description:
              "The name of the IAM role that is used to write to Amazon S3 when exporting a snapshot or cluster.",
          },
          KmsKeyId: {
            type: "string",
            description:
              "The key identifier of the Amazon Web Services KMS key that is used to encrypt the data when it's exported to Amazon S3.",
          },
          Status: {
            type: "string",
            description: "The progress status of the export task.",
          },
          PercentProgress: {
            type: "number",
            description:
              "The progress of the snapshot or cluster export task as a percentage.",
          },
          TotalExtractedDataInGB: {
            type: "number",
            description: "The total amount of data exported, in gigabytes.",
          },
          FailureCause: {
            type: "string",
            description: "The reason the export failed, if it failed.",
          },
          WarningMessage: {
            type: "string",
            description: "A warning about the snapshot or cluster export task.",
          },
          SourceType: {
            type: "string",
            description: "The type of source for the export.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default cancelExportTask;

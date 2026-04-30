import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, StartScanJobCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startScanJob: AppBlock = {
  name: "Start Scan Job",
  description: `Starts scanning jobs for specific resources.`,
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
        IamRoleArn: {
          name: "Iam Role Arn",
          description:
            "Specifies the IAM role ARN used to create the target recovery point; for example, arn:aws:iam::123456789012:role/S3Access.",
          type: "string",
          required: true,
        },
        IdempotencyToken: {
          name: "Idempotency Token",
          description:
            "A customer-chosen string that you can use to distinguish between otherwise identical calls to StartScanJob.",
          type: "string",
          required: false,
        },
        MalwareScanner: {
          name: "Malware Scanner",
          description:
            "Specifies the malware scanner used during the scan job.",
          type: "string",
          required: true,
        },
        RecoveryPointArn: {
          name: "Recovery Point Arn",
          description:
            "An Amazon Resource Name (ARN) that uniquely identifies a recovery point.",
          type: "string",
          required: true,
        },
        ScanBaseRecoveryPointArn: {
          name: "Scan Base Recovery Point Arn",
          description:
            "An ARN that uniquely identifies the base recovery point to be used for incremental scanning.",
          type: "string",
          required: false,
        },
        ScanMode: {
          name: "Scan Mode",
          description: "Specifies the scan type use for the scan job.",
          type: "string",
          required: true,
        },
        ScannerRoleArn: {
          name: "Scanner Role Arn",
          description: "Specified the IAM scanner role ARN.",
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

        const command = new StartScanJobCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Scan Job Result",
      description: "Result from StartScanJob operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CreationDate: {
            type: "string",
            description:
              "The date and time that a backup job is created, in Unix format and Coordinated Universal Time (UTC).",
          },
          ScanJobId: {
            type: "string",
            description:
              "Uniquely identifies a request to Backup to back up a resource.",
          },
        },
        required: ["CreationDate", "ScanJobId"],
      },
    },
  },
};

export default startScanJob;

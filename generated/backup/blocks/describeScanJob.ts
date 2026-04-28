import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, DescribeScanJobCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeScanJob: AppBlock = {
  name: "Describe Scan Job",
  description: `Returns scan job details for the specified ScanJobID.`,
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
        ScanJobId: {
          name: "Scan Job Id",
          description:
            "Uniquely identifies a request to Backup to scan a resource.",
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

        const command = new DescribeScanJobCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Scan Job Result",
      description: "Result from DescribeScanJob operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AccountId: {
            type: "string",
            description: "Returns the account ID that owns the scan job.",
          },
          BackupVaultArn: {
            type: "string",
            description:
              "An Amazon Resource Name (ARN) that uniquely identifies a backup vault; for example, arn:aws:backup:u...",
          },
          BackupVaultName: {
            type: "string",
            description:
              "The name of a logical container where backups are stored.",
          },
          CompletionDate: {
            type: "string",
            description:
              "The date and time that a backup index finished creation, in Unix format and Coordinated Universal Time (UTC).",
          },
          CreatedBy: {
            type: "object",
            properties: {
              BackupPlanArn: {
                type: "string",
              },
              BackupPlanId: {
                type: "string",
              },
              BackupPlanVersion: {
                type: "string",
              },
              BackupRuleId: {
                type: "string",
              },
            },
            required: [
              "BackupPlanArn",
              "BackupPlanId",
              "BackupPlanVersion",
              "BackupRuleId",
            ],
            additionalProperties: false,
            description:
              "Contains identifying information about the creation of a scan job, including the backup plan and rule that initiated the scan.",
          },
          CreationDate: {
            type: "string",
            description:
              "The date and time that a backup index finished creation, in Unix format and Coordinated Universal Time (UTC).",
          },
          IamRoleArn: {
            type: "string",
            description:
              "An Amazon Resource Name (ARN) that uniquely identifies a backup vault; for example, arn:aws:iam::123456789012:role/S3Access.",
          },
          MalwareScanner: {
            type: "string",
            description:
              "The scanning engine used for the corresponding scan job.",
          },
          RecoveryPointArn: {
            type: "string",
            description:
              "An ARN that uniquely identifies the target recovery point for scanning.",
          },
          ResourceArn: {
            type: "string",
            description:
              "An ARN that uniquely identifies the source resource of the corresponding recovery point ARN.",
          },
          ResourceName: {
            type: "string",
            description:
              "The non-unique name of the resource that belongs to the specified backup.",
          },
          ResourceType: {
            type: "string",
            description:
              "The type of Amazon Web Services Resource to be backed up; for example, an Amazon Elastic Block Store (Amazon EBS) volume.",
          },
          ScanBaseRecoveryPointArn: {
            type: "string",
            description:
              "An ARN that uniquely identifies the base recovery point for scanning.",
          },
          ScanId: {
            type: "string",
            description:
              "The scan ID generated by Amazon GuardDuty for the corresponding Scan Job ID request from Backup.",
          },
          ScanJobId: {
            type: "string",
            description:
              "The scan job ID that uniquely identified the request to Backup.",
          },
          ScanMode: {
            type: "string",
            description: "Specifies the scan type used for the scan job.",
          },
          ScanResult: {
            type: "object",
            properties: {
              ScanResultStatus: {
                type: "string",
              },
            },
            required: ["ScanResultStatus"],
            additionalProperties: false,
            description:
              "Contains the ScanResultsStatus for the scanning job and returns THREATS_FOUND or NO_THREATS_FOUND for completed jobs.",
          },
          ScannerRoleArn: {
            type: "string",
            description:
              "Specifies the scanner IAM role ARN used to for the scan job.",
          },
          State: {
            type: "string",
            description: "The current state of a scan job.",
          },
          StatusMessage: {
            type: "string",
            description:
              "A detailed message explaining the status of the job to back up a resource.",
          },
        },
        required: [
          "AccountId",
          "BackupVaultArn",
          "BackupVaultName",
          "CreatedBy",
          "CreationDate",
          "IamRoleArn",
          "MalwareScanner",
          "RecoveryPointArn",
          "ResourceArn",
          "ResourceName",
          "ResourceType",
          "ScanJobId",
          "ScanMode",
          "ScannerRoleArn",
          "State",
        ],
      },
    },
  },
};

export default describeScanJob;

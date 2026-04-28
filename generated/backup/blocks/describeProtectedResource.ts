import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  DescribeProtectedResourceCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeProtectedResource: AppBlock = {
  name: "Describe Protected Resource",
  description: `Returns information about a saved resource, including the last time it was backed up, its Amazon Resource Name (ARN), and the Amazon Web Services service type of the saved resource.`,
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
        ResourceArn: {
          name: "Resource Arn",
          description:
            "An Amazon Resource Name (ARN) that uniquely identifies a resource.",
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

        const command = new DescribeProtectedResourceCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Protected Resource Result",
      description: "Result from DescribeProtectedResource operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ResourceArn: {
            type: "string",
            description: "An ARN that uniquely identifies a resource.",
          },
          ResourceType: {
            type: "string",
            description:
              "The type of Amazon Web Services resource saved as a recovery point; for example, an Amazon EBS volume or an Amazon RDS database.",
          },
          LastBackupTime: {
            type: "string",
            description:
              "The date and time that a resource was last backed up, in Unix format and Coordinated Universal Time (UTC).",
          },
          ResourceName: {
            type: "string",
            description:
              "The name of the resource that belongs to the specified backup.",
          },
          LastBackupVaultArn: {
            type: "string",
            description:
              "The ARN (Amazon Resource Name) of the backup vault that contains the most recent backup recovery point.",
          },
          LastRecoveryPointArn: {
            type: "string",
            description:
              "The ARN (Amazon Resource Name) of the most recent recovery point.",
          },
          LatestRestoreExecutionTimeMinutes: {
            type: "number",
            description:
              "The time, in minutes, that the most recent restore job took to complete.",
          },
          LatestRestoreJobCreationDate: {
            type: "string",
            description: "The creation date of the most recent restore job.",
          },
          LatestRestoreRecoveryPointCreationDate: {
            type: "string",
            description: "The date the most recent recovery point was created.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeProtectedResource;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  UpdateContinuousBackupsCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateContinuousBackups: AppBlock = {
  name: "Update Continuous Backups",
  description: `UpdateContinuousBackups enables or disables point in time recovery for the specified table.`,
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
        TableName: {
          name: "Table Name",
          description: "The name of the table.",
          type: "string",
          required: true,
        },
        PointInTimeRecoverySpecification: {
          name: "Point In Time Recovery Specification",
          description:
            "Represents the settings used to enable point in time recovery.",
          type: {
            type: "object",
            properties: {
              PointInTimeRecoveryEnabled: {
                type: "boolean",
              },
              RecoveryPeriodInDays: {
                type: "number",
              },
            },
            required: ["PointInTimeRecoveryEnabled"],
            additionalProperties: false,
          },
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

        const client = new DynamoDBClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateContinuousBackupsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Continuous Backups Result",
      description: "Result from UpdateContinuousBackups operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ContinuousBackupsDescription: {
            type: "object",
            properties: {
              ContinuousBackupsStatus: {
                type: "string",
              },
              PointInTimeRecoveryDescription: {
                type: "object",
                properties: {
                  PointInTimeRecoveryStatus: {
                    type: "string",
                  },
                  RecoveryPeriodInDays: {
                    type: "number",
                  },
                  EarliestRestorableDateTime: {
                    type: "string",
                  },
                  LatestRestorableDateTime: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            required: ["ContinuousBackupsStatus"],
            additionalProperties: false,
            description:
              "Represents the continuous backups and point in time recovery settings on the table.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateContinuousBackups;

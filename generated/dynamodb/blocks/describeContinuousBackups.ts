import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  DescribeContinuousBackupsCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeContinuousBackups: AppBlock = {
  name: "Describe Continuous Backups",
  description: `Checks the status of continuous backups and point in time recovery on the specified table.`,
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
          description:
            "Name of the table for which the customer wants to check the continuous backups and point in time recovery settings.",
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

        const client = new DynamoDBClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeContinuousBackupsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Continuous Backups Result",
      description: "Result from DescribeContinuousBackups operation",
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

export default describeContinuousBackups;

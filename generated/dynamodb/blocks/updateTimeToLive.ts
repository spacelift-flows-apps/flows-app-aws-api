import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  UpdateTimeToLiveCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateTimeToLive: AppBlock = {
  name: "Update Time To Live",
  description: `The UpdateTimeToLive method enables or disables Time to Live (TTL) for the specified table.`,
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
          description: "The name of the table to be configured.",
          type: "string",
          required: true,
        },
        TimeToLiveSpecification: {
          name: "Time To Live Specification",
          description:
            "Represents the settings used to enable or disable Time to Live for the specified table.",
          type: {
            type: "object",
            properties: {
              Enabled: {
                type: "boolean",
              },
              AttributeName: {
                type: "string",
              },
            },
            required: ["Enabled", "AttributeName"],
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
        }

        const client = new DynamoDBClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateTimeToLiveCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Time To Live Result",
      description: "Result from UpdateTimeToLive operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TimeToLiveSpecification: {
            type: "object",
            properties: {
              Enabled: {
                type: "boolean",
              },
              AttributeName: {
                type: "string",
              },
            },
            required: ["Enabled", "AttributeName"],
            additionalProperties: false,
            description:
              "Represents the output of an UpdateTimeToLive operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateTimeToLive;

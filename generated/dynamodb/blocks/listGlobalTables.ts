import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  ListGlobalTablesCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listGlobalTables: AppBlock = {
  name: "List Global Tables",
  description: `Lists all global tables that have a replica in the specified Region.`,
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
        ExclusiveStartGlobalTableName: {
          name: "Exclusive Start Global Table Name",
          description:
            "The first global table name that this operation will evaluate.",
          type: "string",
          required: false,
        },
        Limit: {
          name: "Limit",
          description:
            "The maximum number of table names to return, if the parameter is not specified DynamoDB defaults to 100.",
          type: "number",
          required: false,
        },
        RegionName: {
          name: "Region Name",
          description: "Lists the global tables in a specific Region.",
          type: "string",
          required: false,
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

        const command = new ListGlobalTablesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Global Tables Result",
      description: "Result from ListGlobalTables operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          GlobalTables: {
            type: "array",
            items: {
              type: "object",
              properties: {
                GlobalTableName: {
                  type: "string",
                },
                ReplicationGroup: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      RegionName: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description: "List of global table names.",
          },
          LastEvaluatedGlobalTableName: {
            type: "string",
            description: "Last evaluated global table name.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listGlobalTables;

import { AppBlock, events } from "@slflows/sdk/v1";
import { DynamoDBClient, BatchGetItemCommand } from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const batchGetItem: AppBlock = {
  name: "Batch Get Item",
  description: `The BatchGetItem operation returns the attributes of one or more items from one or more tables.`,
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
        RequestItems: {
          name: "Request Items",
          description:
            "A map of one or more table names or table ARNs and, for each table, a map that describes one or more items to retrieve from that table.",
          type: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
          },
          required: true,
        },
        ReturnConsumedCapacity: {
          name: "Return Consumed Capacity",
          description:
            "Determines the level of detail about either provisioned or on-demand throughput consumption that is returned in the response: INDEXES - The response includes the aggregate ConsumedCapacity for the operation, together with ConsumedCapacity for each table and secondary index that was accessed.",
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

        const command = new BatchGetItemCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Batch Get Item Result",
      description: "Result from BatchGetItem operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Responses: {
            type: "object",
            additionalProperties: {
              type: "array",
            },
            description: "A map of table name or table ARN to a list of items.",
          },
          UnprocessedKeys: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
            description:
              "A map of tables and their respective keys that were not processed with the current response.",
          },
          ConsumedCapacity: {
            type: "array",
            items: {
              type: "object",
              properties: {
                TableName: {
                  type: "string",
                },
                CapacityUnits: {
                  type: "number",
                },
                ReadCapacityUnits: {
                  type: "number",
                },
                WriteCapacityUnits: {
                  type: "number",
                },
                Table: {
                  type: "object",
                  properties: {
                    ReadCapacityUnits: {
                      type: "number",
                    },
                    WriteCapacityUnits: {
                      type: "number",
                    },
                    CapacityUnits: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                LocalSecondaryIndexes: {
                  type: "object",
                  additionalProperties: {
                    type: "object",
                  },
                },
                GlobalSecondaryIndexes: {
                  type: "object",
                  additionalProperties: {
                    type: "object",
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "The read capacity units consumed by the entire BatchGetItem operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default batchGetItem;

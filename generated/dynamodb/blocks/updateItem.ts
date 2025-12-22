import { AppBlock, events } from "@slflows/sdk/v1";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateItem: AppBlock = {
  name: "Update Item",
  description: `Edits an existing item's attributes, or adds a new item to the table if it does not already exist.`,
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
          description: "The name of the table containing the item to update.",
          type: "string",
          required: true,
        },
        Key: {
          name: "Key",
          description: "The primary key of the item to be updated.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: true,
        },
        AttributeUpdates: {
          name: "Attribute Updates",
          description: "This is a legacy parameter.",
          type: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
          },
          required: false,
        },
        Expected: {
          name: "Expected",
          description: "This is a legacy parameter.",
          type: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
          },
          required: false,
        },
        ConditionalOperator: {
          name: "Conditional Operator",
          description: "This is a legacy parameter.",
          type: "string",
          required: false,
        },
        ReturnValues: {
          name: "Return Values",
          description:
            "Use ReturnValues if you want to get the item attributes as they appear before or after they are successfully updated.",
          type: "string",
          required: false,
        },
        ReturnConsumedCapacity: {
          name: "Return Consumed Capacity",
          description:
            "Determines the level of detail about either provisioned or on-demand throughput consumption that is returned in the response: INDEXES - The response includes the aggregate ConsumedCapacity for the operation, together with ConsumedCapacity for each table and secondary index that was accessed.",
          type: "string",
          required: false,
        },
        ReturnItemCollectionMetrics: {
          name: "Return Item Collection Metrics",
          description:
            "Determines whether item collection metrics are returned.",
          type: "string",
          required: false,
        },
        UpdateExpression: {
          name: "Update Expression",
          description:
            "An expression that defines one or more attributes to be updated, the action to be performed on them, and new values for them.",
          type: "string",
          required: false,
        },
        ConditionExpression: {
          name: "Condition Expression",
          description:
            "A condition that must be satisfied in order for a conditional update to succeed.",
          type: "string",
          required: false,
        },
        ExpressionAttributeNames: {
          name: "Expression Attribute Names",
          description:
            "One or more substitution tokens for attribute names in an expression.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        ExpressionAttributeValues: {
          name: "Expression Attribute Values",
          description:
            "One or more values that can be substituted in an expression.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        ReturnValuesOnConditionCheckFailure: {
          name: "Return Values On Condition Check Failure",
          description:
            "An optional parameter that returns the item attributes for an UpdateItem operation that failed a condition check.",
          type: "string",
          required: false,
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

        const command = new UpdateItemCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Item Result",
      description: "Result from UpdateItem operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Attributes: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
            description:
              "A map of attribute values as they appear before or after the UpdateItem operation, as determined by the ReturnValues parameter.",
          },
          ConsumedCapacity: {
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
            description:
              "The capacity units consumed by the UpdateItem operation.",
          },
          ItemCollectionMetrics: {
            type: "object",
            properties: {
              ItemCollectionKey: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
              SizeEstimateRangeGB: {
                type: "array",
                items: {
                  type: "number",
                },
              },
            },
            additionalProperties: false,
            description:
              "Information about item collections, if any, that were affected by the UpdateItem operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateItem;

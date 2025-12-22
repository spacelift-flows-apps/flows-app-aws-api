import { AppBlock, events } from "@slflows/sdk/v1";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const scan: AppBlock = {
  name: "Scan",
  description: `The Scan operation returns one or more items and item attributes by accessing every item in a table or a secondary index.`,
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
            "The name of the table containing the requested items or if you provide IndexName, the name of the table to which that index belongs.",
          type: "string",
          required: true,
        },
        IndexName: {
          name: "Index Name",
          description: "The name of a secondary index to scan.",
          type: "string",
          required: false,
        },
        AttributesToGet: {
          name: "Attributes To Get",
          description: "This is a legacy parameter.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Limit: {
          name: "Limit",
          description:
            "The maximum number of items to evaluate (not necessarily the number of matching items).",
          type: "number",
          required: false,
        },
        Select: {
          name: "Select",
          description: "The attributes to be returned in the result.",
          type: "string",
          required: false,
        },
        ScanFilter: {
          name: "Scan Filter",
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
        ExclusiveStartKey: {
          name: "Exclusive Start Key",
          description:
            "The primary key of the first item that this operation will evaluate.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        ReturnConsumedCapacity: {
          name: "Return Consumed Capacity",
          description:
            "Determines the level of detail about either provisioned or on-demand throughput consumption that is returned in the response: INDEXES - The response includes the aggregate ConsumedCapacity for the operation, together with ConsumedCapacity for each table and secondary index that was accessed.",
          type: "string",
          required: false,
        },
        TotalSegments: {
          name: "Total Segments",
          description:
            "For a parallel Scan request, TotalSegments represents the total number of segments into which the Scan operation will be divided.",
          type: "number",
          required: false,
        },
        Segment: {
          name: "Segment",
          description:
            "For a parallel Scan request, Segment identifies an individual segment to be scanned by an application worker.",
          type: "number",
          required: false,
        },
        ProjectionExpression: {
          name: "Projection Expression",
          description:
            "A string that identifies one or more attributes to retrieve from the specified table or index.",
          type: "string",
          required: false,
        },
        FilterExpression: {
          name: "Filter Expression",
          description:
            "A string that contains conditions that DynamoDB applies after the Scan operation, but before the data is returned to you.",
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
        ConsistentRead: {
          name: "Consistent Read",
          description:
            "A Boolean value that determines the read consistency model during the scan: If ConsistentRead is false, then the data returned from Scan might not contain the results from other recently completed write operations (PutItem, UpdateItem, or DeleteItem).",
          type: "boolean",
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

        const command = new ScanCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Scan Result",
      description: "Result from Scan operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Items: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: {
                type: "string",
              },
            },
            description:
              "An array of item attributes that match the scan criteria.",
          },
          Count: {
            type: "number",
            description: "The number of items in the response.",
          },
          ScannedCount: {
            type: "number",
            description:
              "The number of items evaluated, before any ScanFilter is applied.",
          },
          LastEvaluatedKey: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
            description:
              "The primary key of the item where the operation stopped, inclusive of the previous result set.",
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
            description: "The capacity units consumed by the Scan operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default scan;

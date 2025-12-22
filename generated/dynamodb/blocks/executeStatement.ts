import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  ExecuteStatementCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const executeStatement: AppBlock = {
  name: "Execute Statement",
  description: `This operation allows you to perform reads and singleton writes on data stored in DynamoDB, using PartiQL.`,
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
        Statement: {
          name: "Statement",
          description:
            "The PartiQL statement representing the operation to run.",
          type: "string",
          required: true,
        },
        Parameters: {
          name: "Parameters",
          description: "The parameters for the PartiQL statement, if any.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ConsistentRead: {
          name: "Consistent Read",
          description: "The consistency of a read operation.",
          type: "boolean",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "Set this value to get remaining results, if NextToken was returned in the statement response.",
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
        Limit: {
          name: "Limit",
          description:
            "The maximum number of items to evaluate (not necessarily the number of matching items).",
          type: "number",
          required: false,
        },
        ReturnValuesOnConditionCheckFailure: {
          name: "Return Values On Condition Check Failure",
          description:
            "An optional parameter that returns the item attributes for an ExecuteStatement operation that failed a condition check.",
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

        const command = new ExecuteStatementCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Execute Statement Result",
      description: "Result from ExecuteStatement operation",
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
              "If a read operation was used, this property will contain the result of the read operation; a map of attribute names and their values.",
          },
          NextToken: {
            type: "string",
            description:
              "If the response of a read request exceeds the response payload limit DynamoDB will set this value in the response.",
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
            description: "The capacity units consumed by an operation.",
          },
          LastEvaluatedKey: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
            description:
              "The primary key of the item where the operation stopped, inclusive of the previous result set.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default executeStatement;

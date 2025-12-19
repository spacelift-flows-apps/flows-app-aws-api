import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftDataClient,
  GetStatementResultV2Command,
} from "@aws-sdk/client-redshift-data";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getStatementResultV2: AppBlock = {
  name: "Get Statement Result V2",
  description: `Fetches the temporarily cached result of an SQL statement in CSV format.`,
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
        Id: {
          name: "Id",
          description:
            "The identifier of the SQL statement whose results are to be fetched.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description:
            "A value that indicates the starting point for the next set of response records in a subsequent request.",
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

        const client = new RedshiftDataClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetStatementResultV2Command(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Statement Result V2 Result",
      description: "Result from GetStatementResultV2 operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Records: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The results of the SQL statement in CSV format.",
          },
          ColumnMetadata: {
            type: "array",
            items: {
              type: "object",
              properties: {
                isCaseSensitive: {
                  type: "boolean",
                },
                isCurrency: {
                  type: "boolean",
                },
                isSigned: {
                  type: "boolean",
                },
                label: {
                  type: "string",
                },
                name: {
                  type: "string",
                },
                nullable: {
                  type: "number",
                },
                precision: {
                  type: "number",
                },
                scale: {
                  type: "number",
                },
                schemaName: {
                  type: "string",
                },
                tableName: {
                  type: "string",
                },
                typeName: {
                  type: "string",
                },
                length: {
                  type: "number",
                },
                columnDefault: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The properties (metadata) of a column.",
          },
          TotalNumRows: {
            type: "number",
            description:
              "The total number of rows in the result set returned from a query.",
          },
          ResultFormat: {
            type: "string",
            enum: ["JSON", "CSV"],
            description: "The data format of the result of the SQL statement.",
          },
          NextToken: {
            type: "string",
            description:
              "A value that indicates the starting point for the next set of response records in a subsequent request.",
          },
        },
        required: ["Records"],
      },
    },
  },
};

export default getStatementResultV2;

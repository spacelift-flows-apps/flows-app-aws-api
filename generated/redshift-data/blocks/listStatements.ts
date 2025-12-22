import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftDataClient,
  ListStatementsCommand,
} from "@aws-sdk/client-redshift-data";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listStatements: AppBlock = {
  name: "List Statements",
  description: `List of SQL statements.`,
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
        NextToken: {
          name: "Next Token",
          description:
            "A value that indicates the starting point for the next set of response records in a subsequent request.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of SQL statements to return in the response.",
          type: "number",
          required: false,
        },
        StatementName: {
          name: "Statement Name",
          description:
            "The name of the SQL statement specified as input to BatchExecuteStatement or ExecuteStatement to identify the query.",
          type: "string",
          required: false,
        },
        Status: {
          name: "Status",
          description: "The status of the SQL statement to list.",
          type: {
            type: "string",
            enum: [
              "SUBMITTED",
              "PICKED",
              "STARTED",
              "FINISHED",
              "ABORTED",
              "FAILED",
              "ALL",
            ],
          },
          required: false,
        },
        RoleLevel: {
          name: "Role Level",
          description:
            "A value that filters which statements to return in the response.",
          type: "string",
          required: false,
        },
        Database: {
          name: "Database",
          description:
            "The name of the database when listing statements run against a ClusterIdentifier or WorkgroupName.",
          type: "string",
          required: false,
        },
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description: "The cluster identifier.",
          type: "string",
          required: false,
        },
        WorkgroupName: {
          name: "Workgroup Name",
          description:
            "The serverless workgroup name or Amazon Resource Name (ARN).",
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

        const client = new RedshiftDataClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListStatementsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Statements Result",
      description: "Result from ListStatements operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Statements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                QueryString: {
                  type: "string",
                },
                QueryStrings: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                SecretArn: {
                  type: "string",
                },
                Status: {
                  type: "string",
                  enum: [
                    "SUBMITTED",
                    "PICKED",
                    "STARTED",
                    "FINISHED",
                    "ABORTED",
                    "FAILED",
                    "ALL",
                  ],
                },
                StatementName: {
                  type: "string",
                },
                CreatedAt: {
                  type: "string",
                },
                UpdatedAt: {
                  type: "string",
                },
                QueryParameters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["name", "value"],
                    additionalProperties: false,
                  },
                },
                IsBatchStatement: {
                  type: "string",
                },
                ResultFormat: {
                  type: "string",
                  enum: ["JSON", "CSV"],
                },
                SessionId: {
                  type: "string",
                },
              },
              required: ["Id"],
              additionalProperties: false,
            },
            description: "The SQL statements.",
          },
          NextToken: {
            type: "string",
            description:
              "A value that indicates the starting point for the next set of response records in a subsequent request.",
          },
        },
        required: ["Statements"],
      },
    },
  },
};

export default listStatements;

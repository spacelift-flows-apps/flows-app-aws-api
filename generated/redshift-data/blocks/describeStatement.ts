import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftDataClient,
  DescribeStatementCommand,
} from "@aws-sdk/client-redshift-data";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeStatement: AppBlock = {
  name: "Describe Statement",
  description: `Describes the details about a specific instance when a query was run by the Amazon Redshift Data API.`,
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
          description: "The identifier of the SQL statement to describe.",
          type: "string",
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

        const client = new RedshiftDataClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeStatementCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Statement Result",
      description: "Result from DescribeStatement operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Id: {
            type: "string",
            description: "The identifier of the SQL statement described.",
          },
          SecretArn: {
            type: "string",
            description:
              "The name or Amazon Resource Name (ARN) of the secret that enables access to the database.",
          },
          DbUser: {
            type: "string",
            description: "The database user name.",
          },
          Database: {
            type: "string",
            description: "The name of the database.",
          },
          ClusterIdentifier: {
            type: "string",
            description: "The cluster identifier.",
          },
          Duration: {
            type: "number",
            description:
              "The amount of time in nanoseconds that the statement ran.",
          },
          Error: {
            type: "string",
            description:
              "The error message from the cluster if the SQL statement encountered an error while running.",
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
            description: "The status of the SQL statement being described.",
          },
          CreatedAt: {
            type: "string",
            description:
              "The date and time (UTC) when the SQL statement was submitted to run.",
          },
          UpdatedAt: {
            type: "string",
            description:
              "The date and time (UTC) that the metadata for the SQL statement was last updated.",
          },
          RedshiftPid: {
            type: "number",
            description: "The process identifier from Amazon Redshift.",
          },
          HasResultSet: {
            type: "string",
            description:
              "A value that indicates whether the statement has a result set.",
          },
          QueryString: {
            type: "string",
            description: "The SQL statement text.",
          },
          ResultRows: {
            type: "number",
            description:
              "Either the number of rows returned from the SQL statement or the number of rows affected.",
          },
          ResultSize: {
            type: "number",
            description: "The size in bytes of the returned results.",
          },
          RedshiftQueryId: {
            type: "number",
            description:
              "The identifier of the query generated by Amazon Redshift.",
          },
          QueryParameters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                value: {
                  type: "string",
                },
              },
              required: ["name", "value"],
              additionalProperties: false,
            },
            description: "The parameters for the SQL statement.",
          },
          SubStatements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                Duration: {
                  type: "number",
                },
                Error: {
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
                  ],
                },
                CreatedAt: {
                  type: "string",
                },
                UpdatedAt: {
                  type: "string",
                },
                QueryString: {
                  type: "string",
                },
                ResultRows: {
                  type: "number",
                },
                ResultSize: {
                  type: "number",
                },
                RedshiftQueryId: {
                  type: "number",
                },
                HasResultSet: {
                  type: "string",
                },
              },
              required: ["Id"],
              additionalProperties: false,
            },
            description: "The SQL statements from a multiple statement run.",
          },
          WorkgroupName: {
            type: "string",
            description:
              "The serverless workgroup name or Amazon Resource Name (ARN).",
          },
          SessionId: {
            type: "string",
            description: "The session identifier of the query.",
          },
          ResultFormat: {
            type: "string",
            enum: ["JSON", "CSV"],
            description: "The data format of the result of the SQL statement.",
          },
        },
        required: ["Id"],
      },
    },
  },
};

export default describeStatement;

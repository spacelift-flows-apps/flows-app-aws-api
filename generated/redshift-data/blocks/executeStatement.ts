import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftDataClient,
  ExecuteStatementCommand,
} from "@aws-sdk/client-redshift-data";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const executeStatement: AppBlock = {
  name: "Execute Statement",
  description: `Runs an SQL statement, which can be data manipulation language (DML) or data definition language (DDL).`,
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
        Sql: {
          name: "Sql",
          description: "The SQL statement text to run.",
          type: "string",
          required: true,
        },
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description: "The cluster identifier.",
          type: "string",
          required: false,
        },
        SecretArn: {
          name: "Secret Arn",
          description:
            "The name or ARN of the secret that enables access to the database.",
          type: "string",
          required: false,
        },
        DbUser: {
          name: "Db User",
          description: "The database user name.",
          type: "string",
          required: false,
        },
        Database: {
          name: "Database",
          description: "The name of the database.",
          type: "string",
          required: false,
        },
        WithEvent: {
          name: "With Event",
          description:
            "A value that indicates whether to send an event to the Amazon EventBridge event bus after the SQL statement runs.",
          type: "string",
          required: false,
        },
        StatementName: {
          name: "Statement Name",
          description: "The name of the SQL statement.",
          type: "string",
          required: false,
        },
        Parameters: {
          name: "Parameters",
          description: "The parameters for the SQL statement.",
          type: {
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
          },
          required: false,
        },
        WorkgroupName: {
          name: "Workgroup Name",
          description:
            "The serverless workgroup name or Amazon Resource Name (ARN).",
          type: "string",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "A unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        SessionKeepAliveSeconds: {
          name: "Session Keep Alive Seconds",
          description:
            "The number of seconds to keep the session alive after the query finishes.",
          type: "number",
          required: false,
        },
        SessionId: {
          name: "Session Id",
          description: "The session identifier of the query.",
          type: "string",
          required: false,
        },
        ResultFormat: {
          name: "Result Format",
          description: "The data format of the result of the SQL statement.",
          type: {
            type: "string",
            enum: ["JSON", "CSV"],
          },
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

        const client = new RedshiftDataClient({
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
          Id: {
            type: "string",
            description:
              "The identifier of the SQL statement whose results are to be fetched.",
          },
          CreatedAt: {
            type: "string",
            description: "The date and time (UTC) the statement was created.",
          },
          ClusterIdentifier: {
            type: "string",
            description: "The cluster identifier.",
          },
          DbUser: {
            type: "string",
            description: "The database user name.",
          },
          DbGroups: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "A list of colon (:) separated names of database groups.",
          },
          Database: {
            type: "string",
            description: "The name of the database.",
          },
          SecretArn: {
            type: "string",
            description:
              "The name or ARN of the secret that enables access to the database.",
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
        },
        additionalProperties: true,
      },
    },
  },
};

export default executeStatement;

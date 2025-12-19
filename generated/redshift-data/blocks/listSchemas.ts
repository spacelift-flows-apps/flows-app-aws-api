import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftDataClient,
  ListSchemasCommand,
} from "@aws-sdk/client-redshift-data";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listSchemas: AppBlock = {
  name: "List Schemas",
  description: `Lists the schemas in a database.`,
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
          description:
            "The name of the database that contains the schemas to list.",
          type: "string",
          required: true,
        },
        ConnectedDatabase: {
          name: "Connected Database",
          description: "A database name.",
          type: "string",
          required: false,
        },
        SchemaPattern: {
          name: "Schema Pattern",
          description: "A pattern to filter results by schema name.",
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
            "The maximum number of schemas to return in the response.",
          type: "number",
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

        const command = new ListSchemasCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Schemas Result",
      description: "Result from ListSchemas operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Schemas: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The schemas that match the request pattern.",
          },
          NextToken: {
            type: "string",
            description:
              "A value that indicates the starting point for the next set of response records in a subsequent request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listSchemas;

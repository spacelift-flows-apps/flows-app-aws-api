import { AppBlock, events } from "@slflows/sdk/v1";
import { AthenaClient, DeleteDataCatalogCommand } from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteDataCatalog: AppBlock = {
  name: "Delete Data Catalog",
  description: `Deletes a data catalog.`,
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
        Name: {
          name: "Name",
          description: "The name of the data catalog to delete.",
          type: "string",
          required: true,
        },
        DeleteCatalogOnly: {
          name: "Delete Catalog Only",
          description: "Deletes the Athena Data Catalog.",
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

        const client = new AthenaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeleteDataCatalogCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Data Catalog Result",
      description: "Result from DeleteDataCatalog operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DataCatalog: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              Description: {
                type: "string",
              },
              Type: {
                type: "string",
                enum: ["LAMBDA", "GLUE", "HIVE", "FEDERATED"],
              },
              Parameters: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
              Status: {
                type: "string",
                enum: [
                  "CREATE_IN_PROGRESS",
                  "CREATE_COMPLETE",
                  "CREATE_FAILED",
                  "CREATE_FAILED_CLEANUP_IN_PROGRESS",
                  "CREATE_FAILED_CLEANUP_COMPLETE",
                  "CREATE_FAILED_CLEANUP_FAILED",
                  "DELETE_IN_PROGRESS",
                  "DELETE_COMPLETE",
                  "DELETE_FAILED",
                ],
              },
              ConnectionType: {
                type: "string",
                enum: [
                  "DYNAMODB",
                  "MYSQL",
                  "POSTGRESQL",
                  "REDSHIFT",
                  "ORACLE",
                  "SYNAPSE",
                  "SQLSERVER",
                  "DB2",
                  "OPENSEARCH",
                  "BIGQUERY",
                  "GOOGLECLOUDSTORAGE",
                  "HBASE",
                  "DOCUMENTDB",
                  "CMDB",
                  "TPCDS",
                  "TIMESTREAM",
                  "SAPHANA",
                  "SNOWFLAKE",
                  "DATALAKEGEN2",
                  "DB2AS400",
                ],
              },
              Error: {
                type: "string",
              },
            },
            required: ["Name", "Type"],
            additionalProperties: false,
            description:
              "Contains information about a data catalog in an Amazon Web Services account.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteDataCatalog;

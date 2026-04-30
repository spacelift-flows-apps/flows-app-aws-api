import { AppBlock, events } from "@slflows/sdk/v1";
import { AthenaClient, GetTableMetadataCommand } from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getTableMetadata: AppBlock = {
  name: "Get Table Metadata",
  description: `Returns table metadata for the specified catalog, database, and table.`,
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
        CatalogName: {
          name: "Catalog Name",
          description:
            "The name of the data catalog that contains the database and table metadata to return.",
          type: "string",
          required: true,
        },
        DatabaseName: {
          name: "Database Name",
          description:
            "The name of the database that contains the table metadata to return.",
          type: "string",
          required: true,
        },
        TableName: {
          name: "Table Name",
          description: "The name of the table for which metadata is returned.",
          type: "string",
          required: true,
        },
        WorkGroup: {
          name: "Work Group",
          description:
            "The name of the workgroup for which the metadata is being fetched.",
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

        const client = new AthenaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetTableMetadataCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Table Metadata Result",
      description: "Result from GetTableMetadata operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TableMetadata: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              CreateTime: {
                type: "string",
              },
              LastAccessTime: {
                type: "string",
              },
              TableType: {
                type: "string",
              },
              Columns: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                    Type: {
                      type: "string",
                    },
                    Comment: {
                      type: "string",
                    },
                  },
                  required: ["Name"],
                  additionalProperties: false,
                },
              },
              PartitionKeys: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                    Type: {
                      type: "string",
                    },
                    Comment: {
                      type: "string",
                    },
                  },
                  required: ["Name"],
                  additionalProperties: false,
                },
              },
              Parameters: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
            },
            required: ["Name"],
            additionalProperties: false,
            description: "An object that contains table metadata.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getTableMetadata;

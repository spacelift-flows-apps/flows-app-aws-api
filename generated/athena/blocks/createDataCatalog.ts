import { AppBlock, events } from "@slflows/sdk/v1";
import { AthenaClient, CreateDataCatalogCommand } from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createDataCatalog: AppBlock = {
  name: "Create Data Catalog",
  description: `Creates (registers) a data catalog with the specified name and properties.`,
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
          description: "The name of the data catalog to create.",
          type: "string",
          required: true,
        },
        Type: {
          name: "Type",
          description:
            "The type of data catalog to create: LAMBDA for a federated catalog, GLUE for an Glue Data Catalog, and HIVE for an external Apache Hive metastore.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "A description of the data catalog to be created.",
          type: "string",
          required: false,
        },
        Parameters: {
          name: "Parameters",
          description:
            "Specifies the Lambda function or functions to use for creating the data catalog.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        Tags: {
          name: "Tags",
          description:
            "A list of comma separated tags to add to the data catalog that is created.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
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

        const command = new CreateDataCatalogCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Data Catalog Result",
      description: "Result from CreateDataCatalog operation",
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
              },
              Parameters: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
              Status: {
                type: "string",
              },
              ConnectionType: {
                type: "string",
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

export default createDataCatalog;

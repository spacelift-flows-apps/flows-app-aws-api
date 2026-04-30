import { AppBlock, events } from "@slflows/sdk/v1";
import { AthenaClient, GetDatabaseCommand } from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getDatabase: AppBlock = {
  name: "Get Database",
  description: `Returns a database object for the specified database and data catalog.`,
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
            "The name of the data catalog that contains the database to return.",
          type: "string",
          required: true,
        },
        DatabaseName: {
          name: "Database Name",
          description: "The name of the database to return.",
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

        const command = new GetDatabaseCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Database Result",
      description: "Result from GetDatabase operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Database: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              Description: {
                type: "string",
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
            description: "The database returned.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getDatabase;

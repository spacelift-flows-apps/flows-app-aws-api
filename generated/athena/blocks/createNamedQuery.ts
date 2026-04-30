import { AppBlock, events } from "@slflows/sdk/v1";
import { AthenaClient, CreateNamedQueryCommand } from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createNamedQuery: AppBlock = {
  name: "Create Named Query",
  description: `Creates a named query in the specified workgroup.`,
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
          description: "The query name.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "The query description.",
          type: "string",
          required: false,
        },
        Database: {
          name: "Database",
          description: "The database to which the query belongs.",
          type: "string",
          required: true,
        },
        QueryString: {
          name: "Query String",
          description: "The contents of the query with all query statements.",
          type: "string",
          required: true,
        },
        ClientRequestToken: {
          name: "Client Request Token",
          description:
            "A unique case-sensitive string used to ensure the request to create the query is idempotent (executes only once).",
          type: "string",
          required: false,
        },
        WorkGroup: {
          name: "Work Group",
          description:
            "The name of the workgroup in which the named query is being created.",
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

        const command = new CreateNamedQueryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Named Query Result",
      description: "Result from CreateNamedQuery operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NamedQueryId: {
            type: "string",
            description: "The unique ID of the query.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createNamedQuery;

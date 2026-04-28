import { AppBlock, events } from "@slflows/sdk/v1";
import { AthenaClient, ImportNotebookCommand } from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const importNotebook: AppBlock = {
  name: "Import Notebook",
  description: `Imports a single ipynb file to a Spark enabled workgroup.`,
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
        WorkGroup: {
          name: "Work Group",
          description:
            "The name of the Spark enabled workgroup to import the notebook to.",
          type: "string",
          required: true,
        },
        Name: {
          name: "Name",
          description: "The name of the notebook to import.",
          type: "string",
          required: true,
        },
        Payload: {
          name: "Payload",
          description: "The notebook content to be imported.",
          type: "string",
          required: false,
        },
        Type: {
          name: "Type",
          description: "The notebook content type.",
          type: "string",
          required: true,
        },
        NotebookS3LocationUri: {
          name: "Notebook S3Location Uri",
          description:
            "A URI that specifies the Amazon S3 location of a notebook file in ipynb format.",
          type: "string",
          required: false,
        },
        ClientRequestToken: {
          name: "Client Request Token",
          description:
            "A unique case-sensitive string used to ensure the request to import the notebook is idempotent (executes only once).",
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

        const command = new ImportNotebookCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Import Notebook Result",
      description: "Result from ImportNotebook operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NotebookId: {
            type: "string",
            description: "The ID assigned to the imported notebook.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default importNotebook;

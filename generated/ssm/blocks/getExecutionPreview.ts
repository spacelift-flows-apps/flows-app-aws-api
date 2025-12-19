import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, GetExecutionPreviewCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getExecutionPreview: AppBlock = {
  name: "Get Execution Preview",
  description: `Initiates the process of retrieving an existing preview that shows the effects that running a specified Automation runbook would have on the targeted resources.`,
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
        ExecutionPreviewId: {
          name: "Execution Preview Id",
          description: "The ID of the existing execution preview.",
          type: "string",
          required: true,
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetExecutionPreviewCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Execution Preview Result",
      description: "Result from GetExecutionPreview operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ExecutionPreviewId: {
            type: "string",
            description: "The generated ID for the existing execution preview.",
          },
          EndedAt: {
            type: "string",
            description:
              "A UTC timestamp indicating when the execution preview operation ended.",
          },
          Status: {
            type: "string",
            description:
              "The current status of the execution preview operation.",
          },
          StatusMessage: {
            type: "string",
            description:
              "Supplemental information about the current status of the execution preview.",
          },
          ExecutionPreview: {
            type: "string",
            description:
              "Information about the changes that would be made if an execution were run.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getExecutionPreview;

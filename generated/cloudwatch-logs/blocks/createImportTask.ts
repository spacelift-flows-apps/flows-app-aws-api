import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  CreateImportTaskCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createImportTask: AppBlock = {
  name: "Create Import Task",
  description: `Starts an import from a data source to CloudWatch Log and creates a managed log group as the destination for the imported data.`,
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
        importSourceArn: {
          name: "import Source Arn",
          description: "The ARN of the source to import from.",
          type: "string",
          required: true,
        },
        importRoleArn: {
          name: "import Role Arn",
          description:
            "The ARN of the IAM role that grants CloudWatch Logs permission to import from the CloudTrail Lake Event Data Store.",
          type: "string",
          required: true,
        },
        importFilter: {
          name: "import Filter",
          description:
            "Optional filters to constrain the import by CloudTrail event time.",
          type: {
            type: "object",
            properties: {
              startEventTime: {
                type: "number",
              },
              endEventTime: {
                type: "number",
              },
            },
            additionalProperties: false,
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateImportTaskCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Import Task Result",
      description: "Result from CreateImportTask operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          importId: {
            type: "string",
            description: "A unique identifier for the import task.",
          },
          importDestinationArn: {
            type: "string",
            description:
              "The ARN of the CloudWatch Logs log group created as the destination for the imported events.",
          },
          creationTime: {
            type: "number",
            description:
              "The timestamp when the import task was created, expressed as the number of milliseconds after Jan 1, 1970 00:00:00 UTC.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createImportTask;

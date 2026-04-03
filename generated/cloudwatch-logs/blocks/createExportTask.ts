import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  CreateExportTaskCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createExportTask: AppBlock = {
  name: "Create Export Task",
  description: `Creates an export task so that you can efficiently export data from a log group to an Amazon S3 bucket.`,
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
        taskName: {
          name: "task Name",
          description: "The name of the export task.",
          type: "string",
          required: false,
        },
        logGroupName: {
          name: "log Group Name",
          description: "The name of the log group.",
          type: "string",
          required: true,
        },
        logStreamNamePrefix: {
          name: "log Stream Name Prefix",
          description:
            "Export only log streams that match the provided prefix.",
          type: "string",
          required: false,
        },
        from: {
          name: "from",
          description:
            "The start time of the range for the request, expressed as the number of milliseconds after Jan 1, 1970 00:00:00 UTC.",
          type: "number",
          required: true,
        },
        to: {
          name: "to",
          description:
            "The end time of the range for the request, expressed as the number of milliseconds after Jan 1, 1970 00:00:00 UTC.",
          type: "number",
          required: true,
        },
        destination: {
          name: "destination",
          description: "The name of S3 bucket for the exported log data.",
          type: "string",
          required: true,
        },
        destinationPrefix: {
          name: "destination Prefix",
          description:
            "The prefix used as the start of the key for every object exported.",
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateExportTaskCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Export Task Result",
      description: "Result from CreateExportTask operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "The ID of the export task.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createExportTask;

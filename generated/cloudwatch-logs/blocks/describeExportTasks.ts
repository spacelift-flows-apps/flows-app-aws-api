import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  DescribeExportTasksCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeExportTasks: AppBlock = {
  name: "Describe Export Tasks",
  description: `Lists the specified export tasks.`,
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
        taskId: {
          name: "task Id",
          description: "The ID of the export task.",
          type: "string",
          required: false,
        },
        statusCode: {
          name: "status Code",
          description: "The status code of the export task.",
          type: "string",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        limit: {
          name: "limit",
          description: "The maximum number of items returned.",
          type: "number",
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

        const command = new DescribeExportTasksCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Export Tasks Result",
      description: "Result from DescribeExportTasks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          exportTasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                taskId: {
                  type: "string",
                },
                taskName: {
                  type: "string",
                },
                logGroupName: {
                  type: "string",
                },
                from: {
                  type: "number",
                },
                to: {
                  type: "number",
                },
                destination: {
                  type: "string",
                },
                destinationPrefix: {
                  type: "string",
                },
                status: {
                  type: "object",
                  properties: {
                    code: {
                      type: "string",
                    },
                    message: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                executionInfo: {
                  type: "object",
                  properties: {
                    creationTime: {
                      type: "number",
                    },
                    completionTime: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "The export tasks.",
          },
          nextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeExportTasks;

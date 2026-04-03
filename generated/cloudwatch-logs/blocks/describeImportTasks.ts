import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  DescribeImportTasksCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeImportTasks: AppBlock = {
  name: "Describe Import Tasks",
  description: `Lists and describes import tasks, with optional filtering by import status and source ARN.`,
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
        importId: {
          name: "import Id",
          description:
            "Optional filter to describe a specific import task by its ID.",
          type: "string",
          required: false,
        },
        importStatus: {
          name: "import Status",
          description: "Optional filter to list imports by their status.",
          type: "string",
          required: false,
        },
        importSourceArn: {
          name: "import Source Arn",
          description: "Optional filter to list imports from a specific source",
          type: "string",
          required: false,
        },
        limit: {
          name: "limit",
          description:
            "The maximum number of import tasks to return in the response.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "The pagination token for the next set of results.",
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

        const command = new DescribeImportTasksCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Import Tasks Result",
      description: "Result from DescribeImportTasks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          imports: {
            type: "array",
            items: {
              type: "object",
              properties: {
                importId: {
                  type: "string",
                },
                importSourceArn: {
                  type: "string",
                },
                importStatus: {
                  type: "string",
                },
                importDestinationArn: {
                  type: "string",
                },
                importStatistics: {
                  type: "object",
                  properties: {
                    bytesImported: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                importFilter: {
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
                creationTime: {
                  type: "number",
                },
                lastUpdatedTime: {
                  type: "number",
                },
                errorMessage: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "The list of import tasks that match the request filters.",
          },
          nextToken: {
            type: "string",
            description:
              "The token to use when requesting the next set of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeImportTasks;

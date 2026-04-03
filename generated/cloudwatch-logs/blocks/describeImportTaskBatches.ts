import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  DescribeImportTaskBatchesCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeImportTaskBatches: AppBlock = {
  name: "Describe Import Task Batches",
  description: `Gets detailed information about the individual batches within an import task, including their status and any error messages.`,
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
            "The ID of the import task to get batch information for.",
          type: "string",
          required: true,
        },
        batchImportStatus: {
          name: "batch Import Status",
          description:
            "Optional filter to list import batches by their status.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        limit: {
          name: "limit",
          description:
            "The maximum number of import batches to return in the response.",
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

        const command = new DescribeImportTaskBatchesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Import Task Batches Result",
      description: "Result from DescribeImportTaskBatches operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          importSourceArn: {
            type: "string",
            description: "The ARN of the source being imported from.",
          },
          importId: {
            type: "string",
            description: "The ID of the import task.",
          },
          importBatches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                batchId: {
                  type: "string",
                },
                status: {
                  type: "string",
                },
                errorMessage: {
                  type: "string",
                },
              },
              required: ["batchId", "status"],
              additionalProperties: false,
            },
            description:
              "The list of import batches that match the request filters.",
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

export default describeImportTaskBatches;

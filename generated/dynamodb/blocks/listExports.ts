import { AppBlock, events } from "@slflows/sdk/v1";
import { DynamoDBClient, ListExportsCommand } from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listExports: AppBlock = {
  name: "List Exports",
  description: `Lists completed exports within the past 90 days.`,
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
        TableArn: {
          name: "Table Arn",
          description:
            "The Amazon Resource Name (ARN) associated with the exported table.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "Maximum number of results to return per page.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "An optional string that, if supplied, must be copied from the output of a previous call to ListExports.",
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
        }

        const client = new DynamoDBClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListExportsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Exports Result",
      description: "Result from ListExports operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ExportSummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ExportArn: {
                  type: "string",
                },
                ExportStatus: {
                  type: "string",
                },
                ExportType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of ExportSummary objects.",
          },
          NextToken: {
            type: "string",
            description:
              "If this value is returned, there are additional results to be displayed.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listExports;

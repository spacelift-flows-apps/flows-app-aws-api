import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  DescribeLookupTablesCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeLookupTables: AppBlock = {
  name: "Describe Lookup Tables",
  description: `Retrieves metadata about lookup tables in your account.`,
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
        lookupTableNamePrefix: {
          name: "lookup Table Name Prefix",
          description: "A prefix to filter lookup tables by name.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of lookup tables to return in the response.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
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

        const command = new DescribeLookupTablesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Lookup Tables Result",
      description: "Result from DescribeLookupTables operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          lookupTables: {
            type: "array",
            items: {
              type: "object",
              properties: {
                lookupTableArn: {
                  type: "string",
                },
                lookupTableName: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
                tableFields: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                recordsCount: {
                  type: "number",
                },
                sizeBytes: {
                  type: "number",
                },
                lastUpdatedTime: {
                  type: "number",
                },
                kmsKeyId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "An array of structures, where each structure contains metadata about one lookup table.",
          },
          nextToken: {
            type: "string",
            description:
              "The token to use when requesting the next set of items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeLookupTables;

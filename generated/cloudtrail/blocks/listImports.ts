import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  ListImportsCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listImports: AppBlock = {
  name: "List Imports",
  description: `Returns information on all imports, or a select set of imports by ImportStatus or Destination.`,
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
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of imports to display on a single page.",
          type: "number",
          required: false,
        },
        Destination: {
          name: "Destination",
          description: "The ARN of the destination event data store.",
          type: "string",
          required: false,
        },
        ImportStatus: {
          name: "Import Status",
          description: "The status of the import.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "A token you can use to get the next page of import results.",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListImportsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Imports Result",
      description: "Result from ListImports operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Imports: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ImportId: {
                  type: "string",
                },
                ImportStatus: {
                  type: "string",
                },
                Destinations: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                CreatedTimestamp: {
                  type: "string",
                },
                UpdatedTimestamp: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The list of returned imports.",
          },
          NextToken: {
            type: "string",
            description:
              "A token you can use to get the next page of import results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listImports;

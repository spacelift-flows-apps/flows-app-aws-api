import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  StopImportCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const stopImport: AppBlock = {
  name: "Stop Import",
  description: `Stops a specified import.`,
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
        ImportId: {
          name: "Import Id",
          description: "The ID of the import.",
          type: "string",
          required: true,
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

        const command = new StopImportCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Stop Import Result",
      description: "Result from StopImport operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ImportId: {
            type: "string",
            description: "The ID for the import.",
          },
          ImportSource: {
            type: "object",
            properties: {
              S3: {
                type: "object",
                properties: {
                  S3LocationUri: {
                    type: "string",
                  },
                  S3BucketRegion: {
                    type: "string",
                  },
                  S3BucketAccessRoleArn: {
                    type: "string",
                  },
                },
                required: [
                  "S3LocationUri",
                  "S3BucketRegion",
                  "S3BucketAccessRoleArn",
                ],
                additionalProperties: false,
              },
            },
            required: ["S3"],
            additionalProperties: false,
            description: "The source S3 bucket for the import.",
          },
          Destinations: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The ARN of the destination event data store.",
          },
          ImportStatus: {
            type: "string",
            description: "The status of the import.",
          },
          CreatedTimestamp: {
            type: "string",
            description: "The timestamp of the import's creation.",
          },
          UpdatedTimestamp: {
            type: "string",
            description: "The timestamp of the import's last update.",
          },
          StartEventTime: {
            type: "string",
            description:
              "Used with EndEventTime to bound a StartImport request, and limit imported trail events to only those events logged within a specified time period.",
          },
          EndEventTime: {
            type: "string",
            description:
              "Used with StartEventTime to bound a StartImport request, and limit imported trail events to only those events logged within a specified time period.",
          },
          ImportStatistics: {
            type: "object",
            properties: {
              PrefixesFound: {
                type: "number",
              },
              PrefixesCompleted: {
                type: "number",
              },
              FilesCompleted: {
                type: "number",
              },
              EventsCompleted: {
                type: "number",
              },
              FailedEntries: {
                type: "number",
              },
            },
            additionalProperties: false,
            description: "Returns information on the stopped import.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default stopImport;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  StartImportCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startImport: AppBlock = {
  name: "Start Import",
  description: `Starts an import of logged trail events from a source S3 bucket to a destination event data store.`,
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
        Destinations: {
          name: "Destinations",
          description: "The ARN of the destination event data store.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ImportSource: {
          name: "Import Source",
          description: "The source S3 bucket for the import.",
          type: {
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
          },
          required: false,
        },
        StartEventTime: {
          name: "Start Event Time",
          description:
            "Use with EndEventTime to bound a StartImport request, and limit imported trail events to only those events logged within a specified time period.",
          type: "string",
          required: false,
        },
        EndEventTime: {
          name: "End Event Time",
          description:
            "Use with StartEventTime to bound a StartImport request, and limit imported trail events to only those events logged within a specified time period.",
          type: "string",
          required: false,
        },
        ImportId: {
          name: "Import Id",
          description: "The ID of the import.",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new StartImportCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Import Result",
      description: "Result from StartImport operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ImportId: {
            type: "string",
            description: "The ID of the import.",
          },
          Destinations: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The ARN of the destination event data store.",
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
          ImportStatus: {
            type: "string",
            description:
              "Shows the status of the import after a StartImport request.",
          },
          CreatedTimestamp: {
            type: "string",
            description: "The timestamp for the import's creation.",
          },
          UpdatedTimestamp: {
            type: "string",
            description:
              "The timestamp of the import's last update, if applicable.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startImport;

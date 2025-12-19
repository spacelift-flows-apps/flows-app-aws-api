import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, DescribeEventsCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeEvents: AppBlock = {
  name: "Describe Events",
  description: `Returns events related to DB instances, DB clusters, DB parameter groups, DB security groups, DB snapshots, DB cluster snapshots, and RDS Proxies for the past 14 days.`,
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
        SourceIdentifier: {
          name: "Source Identifier",
          description:
            "The identifier of the event source for which events are returned.",
          type: "string",
          required: false,
        },
        SourceType: {
          name: "Source Type",
          description: "The event source to retrieve events for.",
          type: "string",
          required: false,
        },
        StartTime: {
          name: "Start Time",
          description:
            "The beginning of the time interval to retrieve events for, specified in ISO 8601 format.",
          type: "string",
          required: false,
        },
        EndTime: {
          name: "End Time",
          description:
            "The end of the time interval for which to retrieve events, specified in ISO 8601 format.",
          type: "string",
          required: false,
        },
        Duration: {
          name: "Duration",
          description: "The number of minutes to retrieve events for.",
          type: "number",
          required: false,
        },
        EventCategories: {
          name: "Event Categories",
          description:
            "A list of event categories that trigger notifications for a event notification subscription.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "This parameter isn't currently supported.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["Name", "Values"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of records to include in the response.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional pagination token provided by a previous DescribeEvents request.",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeEventsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Events Result",
      description: "Result from DescribeEvents operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous Events request.",
          },
          Events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                SourceIdentifier: {
                  type: "string",
                },
                SourceType: {
                  type: "string",
                },
                Message: {
                  type: "string",
                },
                EventCategories: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                Date: {
                  type: "string",
                },
                SourceArn: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of Event instances.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeEvents;

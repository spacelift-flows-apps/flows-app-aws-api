import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeFleetHistoryCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeFleetHistory: AppBlock = {
  name: "Describe Fleet History",
  description: `Describes the events for the specified EC2 Fleet during the specified time.`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        EventType: {
          name: "Event Type",
          description: "The type of events to describe.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of items to return for this request.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token returned from a previous paginated request.",
          type: "string",
          required: false,
        },
        FleetId: {
          name: "Fleet Id",
          description: "The ID of the EC2 Fleet.",
          type: "string",
          required: true,
        },
        StartTime: {
          name: "Start Time",
          description:
            "The start date and time for the events, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeFleetHistoryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Fleet History Result",
      description: "Result from DescribeFleetHistory operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          HistoryRecords: {
            type: "array",
            items: {
              type: "object",
              properties: {
                EventInformation: {
                  type: "object",
                  properties: {
                    EventDescription: {
                      type: "string",
                    },
                    EventSubType: {
                      type: "string",
                    },
                    InstanceId: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                EventType: {
                  type: "string",
                },
                Timestamp: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the events in the history of the EC2 Fleet.",
          },
          LastEvaluatedTime: {
            type: "string",
            description:
              "The last date and time for the events, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).",
          },
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
          FleetId: {
            type: "string",
            description: "The ID of the EC Fleet.",
          },
          StartTime: {
            type: "string",
            description:
              "The start date and time for the events, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeFleetHistory;

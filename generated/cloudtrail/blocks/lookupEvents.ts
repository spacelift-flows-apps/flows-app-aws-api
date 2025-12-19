import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  LookupEventsCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const lookupEvents: AppBlock = {
  name: "Lookup Events",
  description: `Looks up management events or CloudTrail Insights events that are captured by CloudTrail.`,
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
        LookupAttributes: {
          name: "Lookup Attributes",
          description: "Contains a list of lookup attributes.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AttributeKey: {
                  type: "string",
                },
                AttributeValue: {
                  type: "string",
                },
              },
              required: ["AttributeKey", "AttributeValue"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        StartTime: {
          name: "Start Time",
          description:
            "Specifies that only events that occur after or at the specified time are returned.",
          type: "string",
          required: false,
        },
        EndTime: {
          name: "End Time",
          description:
            "Specifies that only events that occur before or at the specified time are returned.",
          type: "string",
          required: false,
        },
        EventCategory: {
          name: "Event Category",
          description: "Specifies the event category.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The number of events to return.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The token to use to get the next page of results after a previous API call.",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new LookupEventsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Lookup Events Result",
      description: "Result from LookupEvents operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                EventId: {
                  type: "string",
                },
                EventName: {
                  type: "string",
                },
                ReadOnly: {
                  type: "string",
                },
                AccessKeyId: {
                  type: "string",
                },
                EventTime: {
                  type: "string",
                },
                EventSource: {
                  type: "string",
                },
                Username: {
                  type: "string",
                },
                Resources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ResourceType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ResourceName: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                CloudTrailEvent: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of events returned based on the lookup attributes specified and the CloudTrail event.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to use to get the next page of results after a previous API call.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default lookupEvents;

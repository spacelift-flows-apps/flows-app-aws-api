import { AppBlock, events } from "@slflows/sdk/v1";
import {
  HealthClient,
  DescribeEventAggregatesCommand,
} from "@aws-sdk/client-health";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const describeEventAggregates: AppBlock = {
  name: "Describe Event Aggregates",
  description: `Returns the number of events of each event type (issue, scheduled change, and account notification).`,
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
        filter: {
          name: "filter",
          description: "Values to narrow the results returned.",
          type: {
            type: "object",
            properties: {
              actionabilities: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              eventArns: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              eventTypeCodes: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              services: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              regions: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              availabilityZones: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              startTimes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    from: {
                      type: "string",
                    },
                    to: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              endTimes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    from: {
                      type: "string",
                    },
                    to: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              lastUpdatedTimes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    from: {
                      type: "string",
                    },
                    to: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              entityArns: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              entityValues: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              eventTypeCategories: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              tags: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
              },
              eventStatusCodes: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              personas: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        aggregateField: {
          name: "aggregate Field",
          description:
            "The only currently supported value is eventTypeCategory.",
          type: "string",
          required: true,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of items to return in one batch, between 10 and 100, inclusive.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "If the results of a search are large, only a portion of the results are returned, and a nextToken pagination token is returned in the response.",
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

        const client = new HealthClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeEventAggregatesCommand(
          convertTimestamps(commandInput, new Set(["from", "to"])) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Event Aggregates Result",
      description: "Result from DescribeEventAggregates operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          eventAggregates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                aggregateValue: {
                  type: "string",
                },
                count: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description:
              "The number of events in each category that meet the optional filter criteria.",
          },
          nextToken: {
            type: "string",
            description:
              "If the results of a search are large, only a portion of the results are returned, and a nextToken pagination token is returned in the response.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeEventAggregates;

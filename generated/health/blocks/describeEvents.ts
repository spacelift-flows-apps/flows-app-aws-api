import { AppBlock, events } from "@slflows/sdk/v1";
import { HealthClient, DescribeEventsCommand } from "@aws-sdk/client-health";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const describeEvents: AppBlock = {
  name: "Describe Events",
  description: `Returns information about events that meet the specified filter criteria.`,
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
        nextToken: {
          name: "next Token",
          description:
            "If the results of a search are large, only a portion of the results are returned, and a nextToken pagination token is returned in the response.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of items to return in one batch, between 1 and 100, inclusive.",
          type: "number",
          required: false,
        },
        locale: {
          name: "locale",
          description: "The locale (language) to return information in.",
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

        const command = new DescribeEventsCommand(
          convertTimestamps(commandInput, new Set(["from", "to"])) as any,
        );
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
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                arn: {
                  type: "string",
                },
                service: {
                  type: "string",
                },
                eventTypeCode: {
                  type: "string",
                },
                eventTypeCategory: {
                  type: "string",
                },
                region: {
                  type: "string",
                },
                availabilityZone: {
                  type: "string",
                },
                startTime: {
                  type: "string",
                },
                endTime: {
                  type: "string",
                },
                lastUpdatedTime: {
                  type: "string",
                },
                statusCode: {
                  type: "string",
                },
                eventScopeCode: {
                  type: "string",
                },
                actionability: {
                  type: "string",
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
            description: "The events that match the specified filter criteria.",
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

export default describeEvents;

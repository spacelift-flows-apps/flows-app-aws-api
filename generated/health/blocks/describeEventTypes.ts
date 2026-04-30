import { AppBlock, events } from "@slflows/sdk/v1";
import {
  HealthClient,
  DescribeEventTypesCommand,
} from "@aws-sdk/client-health";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeEventTypes: AppBlock = {
  name: "Describe Event Types",
  description: `Returns the event types that meet the specified filter criteria.`,
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
              eventTypeCategories: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              actionabilities: {
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
        locale: {
          name: "locale",
          description: "The locale (language) to return information in.",
          type: "string",
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
            "The maximum number of items to return in one batch, between 10 and 100, inclusive.",
          type: "number",
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

        const command = new DescribeEventTypesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Event Types Result",
      description: "Result from DescribeEventTypes operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          eventTypes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                service: {
                  type: "string",
                },
                code: {
                  type: "string",
                },
                category: {
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
            description:
              "A list of event types that match the filter criteria.",
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

export default describeEventTypes;

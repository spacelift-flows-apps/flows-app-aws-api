import { AppBlock, events } from "@slflows/sdk/v1";
import {
  HealthClient,
  DescribeAffectedEntitiesForOrganizationCommand,
} from "@aws-sdk/client-health";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAffectedEntitiesForOrganization: AppBlock = {
  name: "Describe Affected Entities For Organization",
  description: `Returns a list of entities that have been affected by one or more events for one or more accounts in your organization in Organizations, based on the filter criteria.`,
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
        organizationEntityFilters: {
          name: "organization Entity Filters",
          description:
            "A JSON set of elements including the awsAccountId and the eventArn.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                eventArn: {
                  type: "string",
                },
                awsAccountId: {
                  type: "string",
                },
              },
              required: ["eventArn"],
              additionalProperties: false,
            },
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
            "The maximum number of items to return in one batch, between 1 and 100, inclusive.",
          type: "number",
          required: false,
        },
        organizationEntityAccountFilters: {
          name: "organization Entity Account Filters",
          description:
            "A JSON set of elements including the awsAccountId, eventArn and a set of statusCodes.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                eventArn: {
                  type: "string",
                },
                awsAccountId: {
                  type: "string",
                },
                statusCodes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["eventArn"],
              additionalProperties: false,
            },
          },
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

        const command = new DescribeAffectedEntitiesForOrganizationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Affected Entities For Organization Result",
      description:
        "Result from DescribeAffectedEntitiesForOrganization operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          entities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                entityArn: {
                  type: "string",
                },
                eventArn: {
                  type: "string",
                },
                entityValue: {
                  type: "string",
                },
                entityUrl: {
                  type: "string",
                },
                awsAccountId: {
                  type: "string",
                },
                lastUpdatedTime: {
                  type: "string",
                },
                statusCode: {
                  type: "string",
                },
                tags: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
                entityMetadata: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "A JSON set of elements including the awsAccountId and its entityArn, entityValue and its entityArn, lastUpdatedTime, and statusCode.",
          },
          failedSet: {
            type: "array",
            items: {
              type: "object",
              properties: {
                awsAccountId: {
                  type: "string",
                },
                eventArn: {
                  type: "string",
                },
                errorName: {
                  type: "string",
                },
                errorMessage: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A JSON set of elements of the failed response, including the awsAccountId, errorMessage, errorName, and eventArn.",
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

export default describeAffectedEntitiesForOrganization;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  HealthClient,
  DescribeEventDetailsForOrganizationCommand,
} from "@aws-sdk/client-health";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeEventDetailsForOrganization: AppBlock = {
  name: "Describe Event Details For Organization",
  description: `Returns detailed information about one or more specified events for one or more Amazon Web Services accounts in your organization.`,
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
        organizationEventDetailFilters: {
          name: "organization Event Detail Filters",
          description:
            "A set of JSON elements that includes the awsAccountId and the eventArn.",
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
          required: true,
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

        const command = new DescribeEventDetailsForOrganizationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Event Details For Organization Result",
      description: "Result from DescribeEventDetailsForOrganization operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          successfulSet: {
            type: "array",
            items: {
              type: "object",
              properties: {
                awsAccountId: {
                  type: "string",
                },
                event: {
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
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                eventDescription: {
                  type: "object",
                  properties: {
                    latestDescription: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                eventMetadata: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the events that could be retrieved.",
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
              "Error messages for any events that could not be retrieved.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeEventDetailsForOrganization;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  HealthClient,
  DescribeEntityAggregatesForOrganizationCommand,
} from "@aws-sdk/client-health";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeEntityAggregatesForOrganization: AppBlock = {
  name: "Describe Entity Aggregates For Organization",
  description: `Returns a list of entity aggregates for your Organizations that are affected by each of the specified events.`,
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
        eventArns: {
          name: "event Arns",
          description: "A list of event ARNs (unique identifiers).",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        awsAccountIds: {
          name: "aws Account Ids",
          description:
            "A list of 12-digit Amazon Web Services account numbers that contains the affected entities.",
          type: {
            type: "array",
            items: {
              type: "string",
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

        const command = new DescribeEntityAggregatesForOrganizationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Entity Aggregates For Organization Result",
      description:
        "Result from DescribeEntityAggregatesForOrganization operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          organizationEntityAggregates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                eventArn: {
                  type: "string",
                },
                count: {
                  type: "number",
                },
                statuses: {
                  type: "object",
                  additionalProperties: {
                    type: "number",
                  },
                },
                accounts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      accountId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      count: {
                        type: "object",
                        additionalProperties: true,
                      },
                      statuses: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "The list of entity aggregates for each of the specified accounts that are affected by each of the specified events.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeEntityAggregatesForOrganization;

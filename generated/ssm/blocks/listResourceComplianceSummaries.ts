import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  ListResourceComplianceSummariesCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listResourceComplianceSummaries: AppBlock = {
  name: "List Resource Compliance Summaries",
  description: `Returns a resource-level summary count.`,
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
        Filters: {
          name: "Filters",
          description: "One or more filters.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                Type: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "A token to start the list.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return for this call.",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListResourceComplianceSummariesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Resource Compliance Summaries Result",
      description: "Result from ListResourceComplianceSummaries operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ResourceComplianceSummaryItems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ComplianceType: {
                  type: "string",
                },
                ResourceType: {
                  type: "string",
                },
                ResourceId: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                OverallSeverity: {
                  type: "string",
                },
                ExecutionSummary: {
                  type: "object",
                  properties: {
                    ExecutionTime: {
                      type: "string",
                    },
                    ExecutionId: {
                      type: "string",
                    },
                    ExecutionType: {
                      type: "string",
                    },
                  },
                  required: ["ExecutionTime"],
                  additionalProperties: false,
                },
                CompliantSummary: {
                  type: "object",
                  properties: {
                    CompliantCount: {
                      type: "number",
                    },
                    SeveritySummary: {
                      type: "object",
                      properties: {
                        CriticalCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        HighCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MediumCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        LowCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        InformationalCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        UnspecifiedCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                NonCompliantSummary: {
                  type: "object",
                  properties: {
                    NonCompliantCount: {
                      type: "number",
                    },
                    SeveritySummary: {
                      type: "object",
                      properties: {
                        CriticalCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        HighCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MediumCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        LowCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        InformationalCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                        UnspecifiedCount: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description:
              "A summary count for specified or targeted managed nodes.",
          },
          NextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listResourceComplianceSummaries;

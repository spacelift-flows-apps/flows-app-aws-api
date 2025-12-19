import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  ListMetricsCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listMetrics: AppBlock = {
  name: "List Metrics",
  description: `List the specified metrics.`,
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
        Namespace: {
          name: "Namespace",
          description: "The metric namespace to filter against.",
          type: "string",
          required: false,
        },
        MetricName: {
          name: "Metric Name",
          description: "The name of the metric to filter against.",
          type: "string",
          required: false,
        },
        Dimensions: {
          name: "Dimensions",
          description: "The dimensions to filter against.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              required: ["Name"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The token returned by a previous call to indicate that there is more data available.",
          type: "string",
          required: false,
        },
        RecentlyActive: {
          name: "Recently Active",
          description:
            "To filter the results to show only metrics that have had data points published in the past three hours, specify this parameter with a value of PT3H.",
          type: "string",
          required: false,
        },
        IncludeLinkedAccounts: {
          name: "Include Linked Accounts",
          description:
            "If you are using this operation in a monitoring account, specify true to include metrics from source accounts in the returned data.",
          type: "boolean",
          required: false,
        },
        OwningAccount: {
          name: "Owning Account",
          description:
            "When you use this operation in a monitoring account, use this field to return metrics only from one source account.",
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

        const client = new CloudWatchClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListMetricsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Metrics Result",
      description: "Result from ListMetrics operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Metrics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Namespace: {
                  type: "string",
                },
                MetricName: {
                  type: "string",
                },
                Dimensions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Name", "Value"],
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description: "The metrics that match your request.",
          },
          NextToken: {
            type: "string",
            description:
              "The token that marks the start of the next batch of returned results.",
          },
          OwningAccounts: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "If you are using this operation in a monitoring account, this array contains the account IDs of the source accounts where the metrics in the returned data are from.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listMetrics;

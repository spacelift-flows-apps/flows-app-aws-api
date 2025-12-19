import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeFlowLogsCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeFlowLogs: AppBlock = {
  name: "Describe Flow Logs",
  description: `Describes one or more flow logs.`,
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
        Filter: {
          name: "Filter",
          description: "One or more filters.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        FlowLogIds: {
          name: "Flow Log Ids",
          description: "One or more flow log IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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
          description: "The token to request the next page of items.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeFlowLogsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Flow Logs Result",
      description: "Result from DescribeFlowLogs operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          FlowLogs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CreationTime: {
                  type: "string",
                },
                DeliverLogsErrorMessage: {
                  type: "string",
                },
                DeliverLogsPermissionArn: {
                  type: "string",
                },
                DeliverCrossAccountRole: {
                  type: "string",
                },
                DeliverLogsStatus: {
                  type: "string",
                },
                FlowLogId: {
                  type: "string",
                },
                FlowLogStatus: {
                  type: "string",
                },
                LogGroupName: {
                  type: "string",
                },
                ResourceId: {
                  type: "string",
                },
                TrafficType: {
                  type: "string",
                },
                LogDestinationType: {
                  type: "string",
                },
                LogDestination: {
                  type: "string",
                },
                LogFormat: {
                  type: "string",
                },
                Tags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                MaxAggregationInterval: {
                  type: "number",
                },
                DestinationOptions: {
                  type: "object",
                  properties: {
                    FileFormat: {
                      type: "string",
                    },
                    HiveCompatiblePartitions: {
                      type: "boolean",
                    },
                    PerHourPartition: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "Information about the flow logs.",
          },
          NextToken: {
            type: "string",
            description: "The token to request the next page of items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeFlowLogs;

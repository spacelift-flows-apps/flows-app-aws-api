import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DescribeStackResourceDriftsCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeStackResourceDrifts: AppBlock = {
  name: "Describe Stack Resource Drifts",
  description: `Returns drift information for the resources that have been checked for drift in the specified stack.`,
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
        StackName: {
          name: "Stack Name",
          description:
            "The name of the stack for which you want drift information.",
          type: "string",
          required: true,
        },
        StackResourceDriftStatusFilters: {
          name: "Stack Resource Drift Status Filters",
          description:
            "The resource drift status values to use as filters for the resource drift results returned.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "A string that identifies the next page of stack resource drift results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to be returned with a single call.",
          type: "number",
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeStackResourceDriftsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Stack Resource Drifts Result",
      description: "Result from DescribeStackResourceDrifts operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StackResourceDrifts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                StackId: {
                  type: "string",
                },
                LogicalResourceId: {
                  type: "string",
                },
                PhysicalResourceId: {
                  type: "string",
                },
                PhysicalResourceIdContext: {
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
                    required: ["Key", "Value"],
                    additionalProperties: false,
                  },
                },
                ResourceType: {
                  type: "string",
                },
                ExpectedProperties: {
                  type: "string",
                },
                ActualProperties: {
                  type: "string",
                },
                PropertyDifferences: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      PropertyPath: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ExpectedValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ActualValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      DifferenceType: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: [
                      "PropertyPath",
                      "ExpectedValue",
                      "ActualValue",
                      "DifferenceType",
                    ],
                    additionalProperties: false,
                  },
                },
                StackResourceDriftStatus: {
                  type: "string",
                },
                Timestamp: {
                  type: "string",
                },
                ModuleInfo: {
                  type: "object",
                  properties: {
                    TypeHierarchy: {
                      type: "string",
                    },
                    LogicalIdHierarchy: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                DriftStatusReason: {
                  type: "string",
                },
              },
              required: [
                "StackId",
                "LogicalResourceId",
                "ResourceType",
                "StackResourceDriftStatus",
                "Timestamp",
              ],
              additionalProperties: false,
            },
            description:
              "Drift information for the resources that have been checked for drift in the specified stack.",
          },
          NextToken: {
            type: "string",
            description:
              "If the request doesn't return all the remaining results, NextToken is set to a token.",
          },
        },
        required: ["StackResourceDrifts"],
      },
    },
  },
};

export default describeStackResourceDrifts;

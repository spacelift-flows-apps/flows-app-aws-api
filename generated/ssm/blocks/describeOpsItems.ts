import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, DescribeOpsItemsCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeOpsItems: AppBlock = {
  name: "Describe Ops Items",
  description: `Query a set of OpsItems.`,
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
        OpsItemFilters: {
          name: "Ops Item Filters",
          description: "One or more filters to limit the response.",
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
                Operator: {
                  type: "string",
                },
              },
              required: ["Key", "Values", "Operator"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return for this call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "A token to start the list.",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeOpsItemsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Ops Items Result",
      description: "Result from DescribeOpsItems operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
          OpsItemSummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CreatedBy: {
                  type: "string",
                },
                CreatedTime: {
                  type: "string",
                },
                LastModifiedBy: {
                  type: "string",
                },
                LastModifiedTime: {
                  type: "string",
                },
                Priority: {
                  type: "number",
                },
                Source: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                OpsItemId: {
                  type: "string",
                },
                Title: {
                  type: "string",
                },
                OperationalData: {
                  type: "object",
                  additionalProperties: {
                    type: "object",
                  },
                },
                Category: {
                  type: "string",
                },
                Severity: {
                  type: "string",
                },
                OpsItemType: {
                  type: "string",
                },
                ActualStartTime: {
                  type: "string",
                },
                ActualEndTime: {
                  type: "string",
                },
                PlannedStartTime: {
                  type: "string",
                },
                PlannedEndTime: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of OpsItems.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeOpsItems;

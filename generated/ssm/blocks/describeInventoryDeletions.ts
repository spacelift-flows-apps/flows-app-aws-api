import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  DescribeInventoryDeletionsCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeInventoryDeletions: AppBlock = {
  name: "Describe Inventory Deletions",
  description: `Describes a specific delete inventory operation.`,
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
        DeletionId: {
          name: "Deletion Id",
          description:
            "Specify the delete inventory ID for which you want information.",
          type: "string",
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

        const command = new DescribeInventoryDeletionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Inventory Deletions Result",
      description: "Result from DescribeInventoryDeletions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InventoryDeletions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                DeletionId: {
                  type: "string",
                },
                TypeName: {
                  type: "string",
                },
                DeletionStartTime: {
                  type: "string",
                },
                LastStatus: {
                  type: "string",
                },
                LastStatusMessage: {
                  type: "string",
                },
                DeletionSummary: {
                  type: "object",
                  properties: {
                    TotalCount: {
                      type: "number",
                    },
                    RemainingCount: {
                      type: "number",
                    },
                    SummaryItems: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                LastStatusUpdateTime: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of status items for deleted inventory.",
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

export default describeInventoryDeletions;

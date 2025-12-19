import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, GetOpsSummaryCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getOpsSummary: AppBlock = {
  name: "Get Ops Summary",
  description: `View a summary of operations metadata (OpsData) based on specified filters and aggregators.`,
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
        SyncName: {
          name: "Sync Name",
          description: "Specify the name of a resource data sync to get.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description:
            "Optional filters used to scope down the returned OpsData.",
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
              required: ["Key", "Values"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Aggregators: {
          name: "Aggregators",
          description:
            "Optional aggregators that return counts of OpsData based on one or more expressions.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AggregatorType: {
                  type: "string",
                },
                TypeName: {
                  type: "string",
                },
                AttributeName: {
                  type: "string",
                },
                Values: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
                Filters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Values: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Type: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Key", "Values"],
                    additionalProperties: false,
                  },
                },
                Aggregators: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      AggregatorType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      TypeName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AttributeName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Values: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Filters: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Aggregators: {
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
          },
          required: false,
        },
        ResultAttributes: {
          name: "Result Attributes",
          description: "The OpsData data type to return.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                TypeName: {
                  type: "string",
                },
              },
              required: ["TypeName"],
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

        const command = new GetOpsSummaryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Ops Summary Result",
      description: "Result from GetOpsSummary operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Entities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                Data: {
                  type: "object",
                  additionalProperties: {
                    type: "object",
                  },
                },
              },
              additionalProperties: false,
            },
            description: "The list of aggregated details and filtered OpsData.",
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

export default getOpsSummary;

import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, ListNodesSummaryCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listNodesSummary: AppBlock = {
  name: "List Nodes Summary",
  description: `Generates a summary of managed instance/node metadata based on the filters and aggregators you specify.`,
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
          description:
            "The name of the Amazon Web Services managed resource data sync to retrieve information about.",
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
              required: ["Key", "Values"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Aggregators: {
          name: "Aggregators",
          description:
            "Specify one or more aggregators to return a count of managed nodes that match that expression.",
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
                      Aggregators: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["AggregatorType", "TypeName", "AttributeName"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["AggregatorType", "TypeName", "AttributeName"],
              additionalProperties: false,
            },
          },
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
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

        const command = new ListNodesSummaryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Nodes Summary Result",
      description: "Result from ListNodesSummary operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Summary: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: {
                type: "string",
              },
            },
            description:
              "A collection of objects reporting information about your managed nodes, such as the count of nodes by operating system.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to use when requesting the next set of items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listNodesSummary;

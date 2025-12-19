import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, ListNodesCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listNodes: AppBlock = {
  name: "List Nodes",
  description: `Takes in filters and returns a list of managed nodes matching the filter criteria.`,
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

        const command = new ListNodesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Nodes Result",
      description: "Result from ListNodes operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Nodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CaptureTime: {
                  type: "string",
                },
                Id: {
                  type: "string",
                },
                Owner: {
                  type: "object",
                  properties: {
                    AccountId: {
                      type: "string",
                    },
                    OrganizationalUnitId: {
                      type: "string",
                    },
                    OrganizationalUnitPath: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                Region: {
                  type: "string",
                },
                NodeType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of managed nodes that match the specified filter criteria.",
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

export default listNodes;

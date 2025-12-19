import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, ListInventoryEntriesCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listInventoryEntries: AppBlock = {
  name: "List Inventory Entries",
  description: `A list of inventory items returned by the request.`,
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
        InstanceId: {
          name: "Instance Id",
          description:
            "The managed node ID for which you want inventory information.",
          type: "string",
          required: true,
        },
        TypeName: {
          name: "Type Name",
          description:
            "The type of inventory item for which you want information.",
          type: "string",
          required: true,
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

        const command = new ListInventoryEntriesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Inventory Entries Result",
      description: "Result from ListInventoryEntries operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TypeName: {
            type: "string",
            description: "The type of inventory item returned by the request.",
          },
          InstanceId: {
            type: "string",
            description:
              "The managed node ID targeted by the request to query inventory information.",
          },
          SchemaVersion: {
            type: "string",
            description:
              "The inventory schema version used by the managed nodes.",
          },
          CaptureTime: {
            type: "string",
            description:
              "The time that inventory information was collected for the managed nodes.",
          },
          Entries: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: {
                type: "string",
              },
            },
            description: "A list of inventory items on the managed nodes.",
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

export default listInventoryEntries;

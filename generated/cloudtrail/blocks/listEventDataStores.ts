import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  ListEventDataStoresCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listEventDataStores: AppBlock = {
  name: "List Event Data Stores",
  description: `Returns information about all event data stores in the account, in the current Region.`,
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
        NextToken: {
          name: "Next Token",
          description:
            "A token you can use to get the next page of event data store results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of event data stores to display on a single page.",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListEventDataStoresCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Event Data Stores Result",
      description: "Result from ListEventDataStores operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          EventDataStores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                EventDataStoreArn: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                TerminationProtectionEnabled: {
                  type: "boolean",
                },
                Status: {
                  type: "string",
                },
                AdvancedEventSelectors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      FieldSelectors: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["FieldSelectors"],
                    additionalProperties: false,
                  },
                },
                MultiRegionEnabled: {
                  type: "boolean",
                },
                OrganizationEnabled: {
                  type: "boolean",
                },
                RetentionPeriod: {
                  type: "number",
                },
                CreatedTimestamp: {
                  type: "string",
                },
                UpdatedTimestamp: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Contains information about event data stores in the account, in the current Region.",
          },
          NextToken: {
            type: "string",
            description: "A token you can use to get the next page of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listEventDataStores;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EKSClient,
  ListEksAnywhereSubscriptionsCommand,
} from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listEksAnywhereSubscriptions: AppBlock = {
  name: "List Eks Anywhere Subscriptions",
  description: `Displays the full description of the subscription.`,
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
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of cluster results returned by ListEksAnywhereSubscriptions in paginated output.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "The nextToken value returned from a previous paginated ListEksAnywhereSubscriptions request where maxResults was used and the results exceeded the value of that parameter.",
          type: "string",
          required: false,
        },
        includeStatus: {
          name: "include Status",
          description: "An array of subscription statuses to filter on.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        let credentials = {
          accessKeyId: input.app.config.accessKeyId,
          secretAccessKey: input.app.config.secretAccessKey,
          sessionToken: input.app.config.sessionToken,
        };

        // Determine credentials to use
        if (assumeRoleArn) {
          // Use STS to assume the specified role
          const stsClient = new STSClient({
            region: region,
            credentials: credentials,
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
        }

        const client = new EKSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListEksAnywhereSubscriptionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Eks Anywhere Subscriptions Result",
      description: "Result from ListEksAnywhereSubscriptions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          subscriptions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                },
                arn: {
                  type: "string",
                },
                createdAt: {
                  type: "string",
                },
                effectiveDate: {
                  type: "string",
                },
                expirationDate: {
                  type: "string",
                },
                licenseQuantity: {
                  type: "number",
                },
                licenseType: {
                  type: "string",
                },
                term: {
                  type: "object",
                  properties: {
                    duration: {
                      type: "number",
                    },
                    unit: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                status: {
                  type: "string",
                },
                autoRenew: {
                  type: "boolean",
                },
                licenseArns: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                licenses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "object",
                        additionalProperties: true,
                      },
                      token: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                tags: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of all subscription objects in the region, filtered by includeStatus and paginated by nextToken and maxResults.",
          },
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future ListEksAnywhereSubscriptions request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listEksAnywhereSubscriptions;

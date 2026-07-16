import { AppBlock, events } from "@slflows/sdk/v1";
import {
  OrganizationsClient,
  ListInboundResponsibilityTransfersCommand,
} from "@aws-sdk/client-organizations";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listInboundResponsibilityTransfers: AppBlock = {
  name: "List Inbound Responsibility Transfers",
  description: `Lists transfers that allow you to manage the specified responsibilities for another organization.`,
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
        Type: {
          name: "Type",
          description: "The type of responsibility.",
          type: {
            type: "string",
            enum: ["BILLING"],
          },
          required: true,
        },
        Id: {
          name: "Id",
          description: "ID for the transfer.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The parameter for receiving additional results if you receive a NextToken response in a previous request.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return in the response.",
          type: "number",
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

        const client = new OrganizationsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListInboundResponsibilityTransfersCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Inbound Responsibility Transfers Result",
      description: "Result from ListInboundResponsibilityTransfers operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ResponsibilityTransfers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Arn: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                Id: {
                  type: "string",
                },
                Type: {
                  type: "string",
                  enum: ["BILLING"],
                },
                Status: {
                  type: "string",
                  enum: [
                    "REQUESTED",
                    "DECLINED",
                    "CANCELED",
                    "EXPIRED",
                    "ACCEPTED",
                    "WITHDRAWN",
                  ],
                },
                Source: {
                  type: "object",
                  properties: {
                    ManagementAccountId: {
                      type: "string",
                    },
                    ManagementAccountEmail: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                Target: {
                  type: "object",
                  properties: {
                    ManagementAccountId: {
                      type: "string",
                    },
                    ManagementAccountEmail: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                StartTimestamp: {
                  type: "string",
                },
                EndTimestamp: {
                  type: "string",
                },
                ActiveHandshakeId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A ResponsibilityTransfers object.",
          },
          NextToken: {
            type: "string",
            description:
              "If present, indicates that more output is available than is included in the current response.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listInboundResponsibilityTransfers;

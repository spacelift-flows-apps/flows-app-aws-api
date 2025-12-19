import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeReservedNodesCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeReservedNodes: AppBlock = {
  name: "Describe Reserved Nodes",
  description: `Returns the descriptions of the reserved nodes.`,
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
        ReservedNodeId: {
          name: "Reserved Node Id",
          description: "Identifier for the node reservation.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of response records to return in each call.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional parameter that specifies the starting point to return a set of response records.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeReservedNodesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Reserved Nodes Result",
      description: "Result from DescribeReservedNodes operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "A value that indicates the starting point for the next set of response records in a subsequent request.",
          },
          ReservedNodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ReservedNodeId: {
                  type: "string",
                },
                ReservedNodeOfferingId: {
                  type: "string",
                },
                NodeType: {
                  type: "string",
                },
                StartTime: {
                  type: "string",
                },
                Duration: {
                  type: "number",
                },
                FixedPrice: {
                  type: "number",
                },
                UsagePrice: {
                  type: "number",
                },
                CurrencyCode: {
                  type: "string",
                },
                NodeCount: {
                  type: "number",
                },
                State: {
                  type: "string",
                },
                OfferingType: {
                  type: "string",
                },
                RecurringCharges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      RecurringChargeAmount: {
                        type: "object",
                        additionalProperties: true,
                      },
                      RecurringChargeFrequency: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                ReservedNodeOfferingType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The list of ReservedNode objects.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeReservedNodes;

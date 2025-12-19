import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  GetReservedNodeExchangeConfigurationOptionsCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getReservedNodeExchangeConfigurationOptions: AppBlock = {
  name: "Get Reserved Node Exchange Configuration Options",
  description: `Gets the configuration options for the reserved-node exchange.`,
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
        ActionType: {
          name: "Action Type",
          description: "The action type of the reserved-node configuration.",
          type: "string",
          required: true,
        },
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description:
            "The identifier for the cluster that is the source for a reserved-node exchange.",
          type: "string",
          required: false,
        },
        SnapshotIdentifier: {
          name: "Snapshot Identifier",
          description:
            "The identifier for the snapshot that is the source for the reserved-node exchange.",
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
            "An optional pagination token provided by a previous GetReservedNodeExchangeConfigurationOptions request.",
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

        const command = new GetReservedNodeExchangeConfigurationOptionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Reserved Node Exchange Configuration Options Result",
      description:
        "Result from GetReservedNodeExchangeConfigurationOptions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "A pagination token provided by a previous GetReservedNodeExchangeConfigurationOptions request.",
          },
          ReservedNodeConfigurationOptionList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                SourceReservedNode: {
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
                        additionalProperties: true,
                      },
                    },
                    ReservedNodeOfferingType: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                TargetReservedNodeCount: {
                  type: "number",
                },
                TargetReservedNodeOffering: {
                  type: "object",
                  properties: {
                    ReservedNodeOfferingId: {
                      type: "string",
                    },
                    NodeType: {
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
                    OfferingType: {
                      type: "string",
                    },
                    RecurringCharges: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    ReservedNodeOfferingType: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description:
              "the configuration options for the reserved-node exchange.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getReservedNodeExchangeConfigurationOptions;

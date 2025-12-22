import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  PurchaseReservedNodeOfferingCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const purchaseReservedNodeOffering: AppBlock = {
  name: "Purchase Reserved Node Offering",
  description: `Allows you to purchase reserved nodes.`,
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
        ReservedNodeOfferingId: {
          name: "Reserved Node Offering Id",
          description:
            "The unique identifier of the reserved node offering you want to purchase.",
          type: "string",
          required: true,
        },
        NodeCount: {
          name: "Node Count",
          description:
            "The number of reserved nodes that you want to purchase.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PurchaseReservedNodeOfferingCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Purchase Reserved Node Offering Result",
      description: "Result from PurchaseReservedNodeOffering operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ReservedNode: {
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
                      type: "number",
                    },
                    RecurringChargeFrequency: {
                      type: "string",
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
            description: "Describes a reserved node.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default purchaseReservedNodeOffering;

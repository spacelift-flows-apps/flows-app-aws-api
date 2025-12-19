import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  PurchaseReservedInstancesOfferingCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const purchaseReservedInstancesOffering: AppBlock = {
  name: "Purchase Reserved Instances Offering",
  description: `Purchases a Reserved Instance for use with your account.`,
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
        InstanceCount: {
          name: "Instance Count",
          description: "The number of Reserved Instances to purchase.",
          type: "number",
          required: true,
        },
        ReservedInstancesOfferingId: {
          name: "Reserved Instances Offering Id",
          description: "The ID of the Reserved Instance offering to purchase.",
          type: "string",
          required: true,
        },
        PurchaseTime: {
          name: "Purchase Time",
          description:
            "The time at which to purchase the Reserved Instance, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).",
          type: "string",
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        LimitPrice: {
          name: "Limit Price",
          description:
            "Specified for Reserved Instance Marketplace offerings to limit the total order and ensure that the Reserved Instances are not purchased at unexpected prices.",
          type: {
            type: "object",
            properties: {
              Amount: {
                type: "number",
              },
              CurrencyCode: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PurchaseReservedInstancesOfferingCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Purchase Reserved Instances Offering Result",
      description: "Result from PurchaseReservedInstancesOffering operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ReservedInstancesId: {
            type: "string",
            description: "The IDs of the purchased Reserved Instances.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default purchaseReservedInstancesOffering;

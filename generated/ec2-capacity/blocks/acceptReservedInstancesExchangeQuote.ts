import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  AcceptReservedInstancesExchangeQuoteCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const acceptReservedInstancesExchangeQuote: AppBlock = {
  name: "Accept Reserved Instances Exchange Quote",
  description: `Accepts the Convertible Reserved Instance exchange quote described in the GetReservedInstancesExchangeQuote call.`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        ReservedInstanceIds: {
          name: "Reserved Instance Ids",
          description:
            "The IDs of the Convertible Reserved Instances to exchange for another Convertible Reserved Instance of the same or higher value.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        TargetConfigurations: {
          name: "Target Configurations",
          description:
            "The configuration of the target Convertible Reserved Instance to exchange for your current Convertible Reserved Instances.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                InstanceCount: {
                  type: "number",
                },
                OfferingId: {
                  type: "string",
                },
              },
              required: ["OfferingId"],
              additionalProperties: false,
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
        }

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new AcceptReservedInstancesExchangeQuoteCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Accept Reserved Instances Exchange Quote Result",
      description: "Result from AcceptReservedInstancesExchangeQuote operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ExchangeId: {
            type: "string",
            description: "The ID of the successful exchange.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default acceptReservedInstancesExchangeQuote;

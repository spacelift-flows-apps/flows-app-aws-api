import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, EnableAddressTransferCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const enableAddressTransfer: AppBlock = {
  name: "Enable Address Transfer",
  description: `Enables Elastic IP address transfer.`,
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
        AllocationId: {
          name: "Allocation Id",
          description: "The allocation ID of an Elastic IP address.",
          type: "string",
          required: true,
        },
        TransferAccountId: {
          name: "Transfer Account Id",
          description:
            "The ID of the account that you want to transfer the Elastic IP address to.",
          type: "string",
          required: true,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
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

        const command = new EnableAddressTransferCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Enable Address Transfer Result",
      description: "Result from EnableAddressTransfer operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AddressTransfer: {
            type: "object",
            properties: {
              PublicIp: {
                type: "string",
              },
              AllocationId: {
                type: "string",
              },
              TransferAccountId: {
                type: "string",
              },
              TransferOfferExpirationTimestamp: {
                type: "string",
              },
              TransferOfferAcceptedTimestamp: {
                type: "string",
              },
              AddressTransferStatus: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "An Elastic IP address transfer.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default enableAddressTransfer;

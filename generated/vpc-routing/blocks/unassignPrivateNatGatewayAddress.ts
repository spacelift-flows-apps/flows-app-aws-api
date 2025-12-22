import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  UnassignPrivateNatGatewayAddressCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const unassignPrivateNatGatewayAddress: AppBlock = {
  name: "Unassign Private Nat Gateway Address",
  description: `Unassigns secondary private IPv4 addresses from a private NAT gateway.`,
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
        NatGatewayId: {
          name: "Nat Gateway Id",
          description: "The ID of the NAT gateway.",
          type: "string",
          required: true,
        },
        PrivateIpAddresses: {
          name: "Private Ip Addresses",
          description: "The private IPv4 addresses you want to unassign.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        MaxDrainDurationSeconds: {
          name: "Max Drain Duration Seconds",
          description:
            "The maximum amount of time to wait (in seconds) before forcibly releasing the IP addresses if connections are still in progress.",
          type: "number",
          required: false,
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UnassignPrivateNatGatewayAddressCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Unassign Private Nat Gateway Address Result",
      description: "Result from UnassignPrivateNatGatewayAddress operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NatGatewayId: {
            type: "string",
            description: "The ID of the NAT gateway.",
          },
          NatGatewayAddresses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AllocationId: {
                  type: "string",
                },
                NetworkInterfaceId: {
                  type: "string",
                },
                PrivateIp: {
                  type: "string",
                },
                PublicIp: {
                  type: "string",
                },
                AssociationId: {
                  type: "string",
                },
                IsPrimary: {
                  type: "boolean",
                },
                FailureMessage: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the NAT gateway IP addresses.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default unassignPrivateNatGatewayAddress;

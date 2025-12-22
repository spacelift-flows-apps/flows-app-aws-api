import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  AssignPrivateIpAddressesCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const assignPrivateIpAddresses: AppBlock = {
  name: "Assign Private Ip Addresses",
  description: `Assigns the specified secondary private IP addresses to the specified network interface.`,
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
        Ipv4Prefixes: {
          name: "Ipv4Prefixes",
          description:
            "One or more IPv4 prefixes assigned to the network interface.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Ipv4PrefixCount: {
          name: "Ipv4Prefix Count",
          description:
            "The number of IPv4 prefixes that Amazon Web Services automatically assigns to the network interface.",
          type: "number",
          required: false,
        },
        NetworkInterfaceId: {
          name: "Network Interface Id",
          description: "The ID of the network interface.",
          type: "string",
          required: true,
        },
        PrivateIpAddresses: {
          name: "Private Ip Addresses",
          description:
            "The IP addresses to be assigned as a secondary private IP address to the network interface.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        SecondaryPrivateIpAddressCount: {
          name: "Secondary Private Ip Address Count",
          description:
            "The number of secondary IP addresses to assign to the network interface.",
          type: "number",
          required: false,
        },
        AllowReassignment: {
          name: "Allow Reassignment",
          description:
            "Indicates whether to allow an IP address that is already assigned to another network interface or instance to be reassigned to the specified network interface.",
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

        const command = new AssignPrivateIpAddressesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Assign Private Ip Addresses Result",
      description: "Result from AssignPrivateIpAddresses operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NetworkInterfaceId: {
            type: "string",
            description: "The ID of the network interface.",
          },
          AssignedPrivateIpAddresses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                PrivateIpAddress: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "The private IP addresses assigned to the network interface.",
          },
          AssignedIpv4Prefixes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Ipv4Prefix: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "The IPv4 prefixes that are assigned to the network interface.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default assignPrivateIpAddresses;

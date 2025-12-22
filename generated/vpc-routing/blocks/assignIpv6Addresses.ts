import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, AssignIpv6AddressesCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const assignIpv6Addresses: AppBlock = {
  name: "Assign Ipv6Addresses",
  description: `Assigns the specified IPv6 addresses to the specified network interface.`,
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
        Ipv6PrefixCount: {
          name: "Ipv6Prefix Count",
          description:
            "The number of IPv6 prefixes that Amazon Web Services automatically assigns to the network interface.",
          type: "number",
          required: false,
        },
        Ipv6Prefixes: {
          name: "Ipv6Prefixes",
          description:
            "One or more IPv6 prefixes assigned to the network interface.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        NetworkInterfaceId: {
          name: "Network Interface Id",
          description: "The ID of the network interface.",
          type: "string",
          required: true,
        },
        Ipv6Addresses: {
          name: "Ipv6Addresses",
          description:
            "The IPv6 addresses to be assigned to the network interface.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Ipv6AddressCount: {
          name: "Ipv6Address Count",
          description:
            "The number of additional IPv6 addresses to assign to the network interface.",
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

        const command = new AssignIpv6AddressesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Assign Ipv6Addresses Result",
      description: "Result from AssignIpv6Addresses operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AssignedIpv6Addresses: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The new IPv6 addresses assigned to the network interface.",
          },
          AssignedIpv6Prefixes: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The IPv6 prefixes that are assigned to the network interface.",
          },
          NetworkInterfaceId: {
            type: "string",
            description: "The ID of the network interface.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default assignIpv6Addresses;

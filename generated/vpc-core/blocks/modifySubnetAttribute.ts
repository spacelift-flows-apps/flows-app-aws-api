import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, ModifySubnetAttributeCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifySubnetAttribute: AppBlock = {
  name: "Modify Subnet Attribute",
  description: `Modifies a subnet attribute.`,
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
        AssignIpv6AddressOnCreation: {
          name: "Assign Ipv6Address On Creation",
          description:
            "Specify true to indicate that network interfaces created in the specified subnet should be assigned an IPv6 address.",
          type: {
            type: "object",
            properties: {
              Value: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        MapPublicIpOnLaunch: {
          name: "Map Public Ip On Launch",
          description:
            "Specify true to indicate that network interfaces attached to instances created in the specified subnet should be assigned a public IPv4 address.",
          type: {
            type: "object",
            properties: {
              Value: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        SubnetId: {
          name: "Subnet Id",
          description: "The ID of the subnet.",
          type: "string",
          required: true,
        },
        MapCustomerOwnedIpOnLaunch: {
          name: "Map Customer Owned Ip On Launch",
          description:
            "Specify true to indicate that network interfaces attached to instances created in the specified subnet should be assigned a customer-owned IPv4 address.",
          type: {
            type: "object",
            properties: {
              Value: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        CustomerOwnedIpv4Pool: {
          name: "Customer Owned Ipv4Pool",
          description:
            "The customer-owned IPv4 address pool associated with the subnet.",
          type: "string",
          required: false,
        },
        EnableDns64: {
          name: "Enable Dns64",
          description:
            "Indicates whether DNS queries made to the Amazon-provided DNS Resolver in this subnet should return synthetic IPv6 addresses for IPv4-only destinations.",
          type: {
            type: "object",
            properties: {
              Value: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        PrivateDnsHostnameTypeOnLaunch: {
          name: "Private Dns Hostname Type On Launch",
          description:
            "The type of hostname to assign to instances in the subnet at launch.",
          type: "string",
          required: false,
        },
        EnableResourceNameDnsARecordOnLaunch: {
          name: "Enable Resource Name Dns A Record On Launch",
          description:
            "Indicates whether to respond to DNS queries for instance hostnames with DNS A records.",
          type: {
            type: "object",
            properties: {
              Value: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        EnableResourceNameDnsAAAARecordOnLaunch: {
          name: "Enable Resource Name Dns AAAA Record On Launch",
          description:
            "Indicates whether to respond to DNS queries for instance hostnames with DNS AAAA records.",
          type: {
            type: "object",
            properties: {
              Value: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        EnableLniAtDeviceIndex: {
          name: "Enable Lni At Device Index",
          description:
            "Indicates the device position for local network interfaces in this subnet.",
          type: "number",
          required: false,
        },
        DisableLniAtDeviceIndex: {
          name: "Disable Lni At Device Index",
          description:
            "Specify true to indicate that local network interfaces at the current position should be disabled.",
          type: {
            type: "object",
            properties: {
              Value: {
                type: "boolean",
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

        const command = new ModifySubnetAttributeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Subnet Attribute Result",
      description: "Result from ModifySubnetAttribute operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default modifySubnetAttribute;

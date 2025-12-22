import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateSubnetCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createSubnet: AppBlock = {
  name: "Create Subnet",
  description: `Creates a subnet in the specified VPC.`,
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
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to assign to the subnet.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ResourceType: {
                  type: "string",
                },
                Tags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        AvailabilityZone: {
          name: "Availability Zone",
          description: "The Availability Zone or Local Zone for the subnet.",
          type: "string",
          required: false,
        },
        AvailabilityZoneId: {
          name: "Availability Zone Id",
          description: "The AZ ID or the Local Zone ID of the subnet.",
          type: "string",
          required: false,
        },
        CidrBlock: {
          name: "Cidr Block",
          description:
            "The IPv4 network range for the subnet, in CIDR notation.",
          type: "string",
          required: false,
        },
        Ipv6CidrBlock: {
          name: "Ipv6Cidr Block",
          description:
            "The IPv6 network range for the subnet, in CIDR notation.",
          type: "string",
          required: false,
        },
        OutpostArn: {
          name: "Outpost Arn",
          description: "The Amazon Resource Name (ARN) of the Outpost.",
          type: "string",
          required: false,
        },
        VpcId: {
          name: "Vpc Id",
          description: "The ID of the VPC.",
          type: "string",
          required: true,
        },
        Ipv6Native: {
          name: "Ipv6Native",
          description: "Indicates whether to create an IPv6 only subnet.",
          type: "boolean",
          required: false,
        },
        Ipv4IpamPoolId: {
          name: "Ipv4Ipam Pool Id",
          description: "An IPv4 IPAM pool ID for the subnet.",
          type: "string",
          required: false,
        },
        Ipv4NetmaskLength: {
          name: "Ipv4Netmask Length",
          description: "An IPv4 netmask length for the subnet.",
          type: "number",
          required: false,
        },
        Ipv6IpamPoolId: {
          name: "Ipv6Ipam Pool Id",
          description: "An IPv6 IPAM pool ID for the subnet.",
          type: "string",
          required: false,
        },
        Ipv6NetmaskLength: {
          name: "Ipv6Netmask Length",
          description: "An IPv6 netmask length for the subnet.",
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

        const command = new CreateSubnetCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Subnet Result",
      description: "Result from CreateSubnet operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Subnet: {
            type: "object",
            properties: {
              AvailabilityZoneId: {
                type: "string",
              },
              EnableLniAtDeviceIndex: {
                type: "number",
              },
              MapCustomerOwnedIpOnLaunch: {
                type: "boolean",
              },
              CustomerOwnedIpv4Pool: {
                type: "string",
              },
              OwnerId: {
                type: "string",
              },
              AssignIpv6AddressOnCreation: {
                type: "boolean",
              },
              Ipv6CidrBlockAssociationSet: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AssociationId: {
                      type: "string",
                    },
                    Ipv6CidrBlock: {
                      type: "string",
                    },
                    Ipv6CidrBlockState: {
                      type: "object",
                      properties: {
                        State: {
                          type: "object",
                          additionalProperties: true,
                        },
                        StatusMessage: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    Ipv6AddressAttribute: {
                      type: "string",
                    },
                    IpSource: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              Tags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Key: {
                      type: "string",
                    },
                    Value: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              SubnetArn: {
                type: "string",
              },
              OutpostArn: {
                type: "string",
              },
              EnableDns64: {
                type: "boolean",
              },
              Ipv6Native: {
                type: "boolean",
              },
              PrivateDnsNameOptionsOnLaunch: {
                type: "object",
                properties: {
                  HostnameType: {
                    type: "string",
                  },
                  EnableResourceNameDnsARecord: {
                    type: "boolean",
                  },
                  EnableResourceNameDnsAAAARecord: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              BlockPublicAccessStates: {
                type: "object",
                properties: {
                  InternetGatewayBlockMode: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              Type: {
                type: "string",
              },
              SubnetId: {
                type: "string",
              },
              State: {
                type: "string",
              },
              VpcId: {
                type: "string",
              },
              CidrBlock: {
                type: "string",
              },
              AvailableIpAddressCount: {
                type: "number",
              },
              AvailabilityZone: {
                type: "string",
              },
              DefaultForAz: {
                type: "boolean",
              },
              MapPublicIpOnLaunch: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description: "Information about the subnet.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createSubnet;

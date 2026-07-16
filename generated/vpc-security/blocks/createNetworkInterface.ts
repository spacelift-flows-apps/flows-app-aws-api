import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateNetworkInterfaceCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createNetworkInterface: AppBlock = {
  name: "Create Network Interface",
  description: `Creates a network interface in the specified subnet.`,
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
          description: "The IPv4 prefixes assigned to the network interface.",
          type: {
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
        Ipv6Prefixes: {
          name: "Ipv6Prefixes",
          description: "The IPv6 prefixes assigned to the network interface.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Ipv6Prefix: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        Ipv6PrefixCount: {
          name: "Ipv6Prefix Count",
          description:
            "The number of IPv6 prefixes that Amazon Web Services automatically assigns to the network interface.",
          type: "number",
          required: false,
        },
        InterfaceType: {
          name: "Interface Type",
          description: "The type of network interface.",
          type: {
            type: "string",
            enum: ["efa", "efa-only", "branch", "trunk"],
          },
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to apply to the new network interface.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ResourceType: {
                  type: "string",
                  enum: [
                    "capacity-reservation",
                    "client-vpn-endpoint",
                    "customer-gateway",
                    "carrier-gateway",
                    "coip-pool",
                    "declarative-policies-report",
                    "dedicated-host",
                    "dhcp-options",
                    "egress-only-internet-gateway",
                    "elastic-ip",
                    "elastic-gpu",
                    "export-image-task",
                    "export-instance-task",
                    "fleet",
                    "fpga-image",
                    "host-reservation",
                    "image",
                    "image-usage-report",
                    "import-image-task",
                    "import-snapshot-task",
                    "instance",
                    "instance-event-window",
                    "internet-gateway",
                    "ipam",
                    "ipam-pool",
                    "ipam-scope",
                    "ipv4pool-ec2",
                    "ipv6pool-ec2",
                    "key-pair",
                    "launch-template",
                    "local-gateway",
                    "local-gateway-route-table",
                    "local-gateway-virtual-interface",
                    "local-gateway-virtual-interface-group",
                    "local-gateway-route-table-vpc-association",
                    "local-gateway-route-table-virtual-interface-group-association",
                    "natgateway",
                    "network-acl",
                    "network-interface",
                    "network-insights-analysis",
                    "network-insights-path",
                    "network-insights-access-scope",
                    "network-insights-access-scope-analysis",
                    "outpost-lag",
                    "placement-group",
                    "prefix-list",
                    "replace-root-volume-task",
                    "reserved-instances",
                    "route-table",
                    "security-group",
                    "security-group-rule",
                    "service-link-virtual-interface",
                    "snapshot",
                    "spot-fleet-request",
                    "spot-instances-request",
                    "subnet",
                    "subnet-cidr-reservation",
                    "traffic-mirror-filter",
                    "traffic-mirror-session",
                    "traffic-mirror-target",
                    "transit-gateway",
                    "transit-gateway-attachment",
                    "transit-gateway-connect-peer",
                    "transit-gateway-multicast-domain",
                    "transit-gateway-policy-table",
                    "transit-gateway-metering-policy",
                    "transit-gateway-route-table",
                    "transit-gateway-route-table-announcement",
                    "volume",
                    "vpc",
                    "vpc-endpoint",
                    "vpc-endpoint-connection",
                    "vpc-endpoint-service",
                    "vpc-endpoint-service-permission",
                    "vpc-peering-connection",
                    "vpn-connection",
                    "vpn-gateway",
                    "vpc-flow-log",
                    "capacity-reservation-fleet",
                    "traffic-mirror-filter-rule",
                    "vpc-endpoint-connection-device-type",
                    "verified-access-instance",
                    "verified-access-group",
                    "verified-access-endpoint",
                    "verified-access-policy",
                    "verified-access-trust-provider",
                    "vpn-connection-device-type",
                    "vpc-block-public-access-exclusion",
                    "vpc-encryption-control",
                    "route-server",
                    "route-server-endpoint",
                    "route-server-peer",
                    "ipam-resource-discovery",
                    "ipam-resource-discovery-association",
                    "instance-connect-endpoint",
                    "verified-access-endpoint-target",
                    "ipam-external-resource-verification-token",
                    "capacity-block",
                    "mac-modification-task",
                    "ipam-prefix-list-resolver",
                    "ipam-policy",
                    "ipam-prefix-list-resolver-target",
                    "secondary-interface",
                    "secondary-network",
                    "secondary-subnet",
                    "capacity-manager-data-export",
                    "vpn-concentrator",
                  ],
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
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        EnablePrimaryIpv6: {
          name: "Enable Primary Ipv6",
          description:
            "If you’re creating a network interface in a dual-stack or IPv6-only subnet, you have the option to assign a primary IPv6 IP address.",
          type: "boolean",
          required: false,
        },
        ConnectionTrackingSpecification: {
          name: "Connection Tracking Specification",
          description:
            "A connection tracking specification for the network interface.",
          type: {
            type: "object",
            properties: {
              TcpEstablishedTimeout: {
                type: "number",
              },
              UdpStreamTimeout: {
                type: "number",
              },
              UdpTimeout: {
                type: "number",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        Operator: {
          name: "Operator",
          description: "Reserved for internal use.",
          type: {
            type: "object",
            properties: {
              Principal: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        SubnetId: {
          name: "Subnet Id",
          description:
            "The ID of the subnet to associate with the network interface.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "A description for the network interface.",
          type: "string",
          required: false,
        },
        PrivateIpAddress: {
          name: "Private Ip Address",
          description:
            "The primary private IPv4 address of the network interface.",
          type: "string",
          required: false,
        },
        Groups: {
          name: "Groups",
          description: "The IDs of the security groups.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        PrivateIpAddresses: {
          name: "Private Ip Addresses",
          description: "The private IPv4 addresses.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Primary: {
                  type: "boolean",
                },
                PrivateIpAddress: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        SecondaryPrivateIpAddressCount: {
          name: "Secondary Private Ip Address Count",
          description:
            "The number of secondary private IPv4 addresses to assign to a network interface.",
          type: "number",
          required: false,
        },
        Ipv6Addresses: {
          name: "Ipv6Addresses",
          description:
            "The IPv6 addresses from the IPv6 CIDR block range of your subnet.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Ipv6Address: {
                  type: "string",
                },
                IsPrimaryIpv6: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        Ipv6AddressCount: {
          name: "Ipv6Address Count",
          description:
            "The number of IPv6 addresses to assign to a network interface.",
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

        const command = new CreateNetworkInterfaceCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Network Interface Result",
      description: "Result from CreateNetworkInterface operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NetworkInterface: {
            type: "object",
            properties: {
              Association: {
                type: "object",
                properties: {
                  AllocationId: {
                    type: "string",
                  },
                  AssociationId: {
                    type: "string",
                  },
                  IpOwnerId: {
                    type: "string",
                  },
                  PublicDnsName: {
                    type: "string",
                  },
                  PublicIp: {
                    type: "string",
                  },
                  CustomerOwnedIp: {
                    type: "string",
                  },
                  CarrierIp: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              Attachment: {
                type: "object",
                properties: {
                  AttachTime: {
                    type: "string",
                  },
                  AttachmentId: {
                    type: "string",
                  },
                  DeleteOnTermination: {
                    type: "boolean",
                  },
                  DeviceIndex: {
                    type: "number",
                  },
                  NetworkCardIndex: {
                    type: "number",
                  },
                  InstanceId: {
                    type: "string",
                  },
                  InstanceOwnerId: {
                    type: "string",
                  },
                  Status: {
                    type: "string",
                    enum: ["attaching", "attached", "detaching", "detached"],
                  },
                  EnaSrdSpecification: {
                    type: "object",
                    properties: {
                      EnaSrdEnabled: {
                        type: "boolean",
                      },
                      EnaSrdUdpSpecification: {
                        type: "object",
                        properties: {
                          EnaSrdUdpEnabled: {
                            type: "boolean",
                          },
                        },
                        additionalProperties: false,
                      },
                    },
                    additionalProperties: false,
                  },
                  EnaQueueCount: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              AvailabilityZone: {
                type: "string",
              },
              ConnectionTrackingConfiguration: {
                type: "object",
                properties: {
                  TcpEstablishedTimeout: {
                    type: "number",
                  },
                  UdpStreamTimeout: {
                    type: "number",
                  },
                  UdpTimeout: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              Description: {
                type: "string",
              },
              Groups: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    GroupId: {
                      type: "string",
                    },
                    GroupName: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              InterfaceType: {
                type: "string",
                enum: [
                  "interface",
                  "natGateway",
                  "efa",
                  "efa-only",
                  "trunk",
                  "load_balancer",
                  "network_load_balancer",
                  "vpc_endpoint",
                  "branch",
                  "transit_gateway",
                  "lambda",
                  "quicksight",
                  "global_accelerator_managed",
                  "api_gateway_managed",
                  "gateway_load_balancer",
                  "gateway_load_balancer_endpoint",
                  "iot_rules_managed",
                  "aws_codestar_connections_managed",
                ],
              },
              Ipv6Addresses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Ipv6Address: {
                      type: "string",
                    },
                    PublicIpv6DnsName: {
                      type: "string",
                    },
                    IsPrimaryIpv6: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
              },
              MacAddress: {
                type: "string",
              },
              NetworkInterfaceId: {
                type: "string",
              },
              OutpostArn: {
                type: "string",
              },
              OwnerId: {
                type: "string",
              },
              PrivateDnsName: {
                type: "string",
              },
              PublicDnsName: {
                type: "string",
              },
              PublicIpDnsNameOptions: {
                type: "object",
                properties: {
                  DnsHostnameType: {
                    type: "string",
                  },
                  PublicIpv4DnsName: {
                    type: "string",
                  },
                  PublicIpv6DnsName: {
                    type: "string",
                  },
                  PublicDualStackDnsName: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              PrivateIpAddress: {
                type: "string",
              },
              PrivateIpAddresses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Association: {
                      type: "object",
                      properties: {
                        AllocationId: {
                          type: "string",
                        },
                        AssociationId: {
                          type: "string",
                        },
                        IpOwnerId: {
                          type: "string",
                        },
                        PublicDnsName: {
                          type: "string",
                        },
                        PublicIp: {
                          type: "string",
                        },
                        CustomerOwnedIp: {
                          type: "string",
                        },
                        CarrierIp: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                    Primary: {
                      type: "boolean",
                    },
                    PrivateDnsName: {
                      type: "string",
                    },
                    PrivateIpAddress: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              Ipv4Prefixes: {
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
              },
              Ipv6Prefixes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Ipv6Prefix: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              RequesterId: {
                type: "string",
              },
              RequesterManaged: {
                type: "boolean",
              },
              SourceDestCheck: {
                type: "boolean",
              },
              Status: {
                type: "string",
                enum: [
                  "available",
                  "associated",
                  "attaching",
                  "in-use",
                  "detaching",
                ],
              },
              SubnetId: {
                type: "string",
              },
              TagSet: {
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
              VpcId: {
                type: "string",
              },
              DenyAllIgwTraffic: {
                type: "boolean",
              },
              Ipv6Native: {
                type: "boolean",
              },
              Ipv6Address: {
                type: "string",
              },
              Operator: {
                type: "object",
                properties: {
                  Managed: {
                    type: "boolean",
                  },
                  Principal: {
                    type: "string",
                  },
                  HiddenByDefault: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              AssociatedSubnets: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              AvailabilityZoneId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the network interface.",
          },
          ClientToken: {
            type: "string",
            description:
              "The token to use to retrieve the next page of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createNetworkInterface;

import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateVpcCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createVpc: AppBlock = {
  name: "Create Vpc",
  description: `Creates a VPC with the specified CIDR blocks.`,
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
        CidrBlock: {
          name: "Cidr Block",
          description: "The IPv4 network range for the VPC, in CIDR notation.",
          type: "string",
          required: false,
        },
        Ipv6Pool: {
          name: "Ipv6Pool",
          description:
            "The ID of an IPv6 address pool from which to allocate the IPv6 CIDR block.",
          type: "string",
          required: false,
        },
        Ipv6CidrBlock: {
          name: "Ipv6Cidr Block",
          description: "The IPv6 CIDR block from the IPv6 address pool.",
          type: "string",
          required: false,
        },
        Ipv4IpamPoolId: {
          name: "Ipv4Ipam Pool Id",
          description:
            "The ID of an IPv4 IPAM pool you want to use for allocating this VPC's CIDR.",
          type: "string",
          required: false,
        },
        Ipv4NetmaskLength: {
          name: "Ipv4Netmask Length",
          description:
            "The netmask length of the IPv4 CIDR you want to allocate to this VPC from an Amazon VPC IP Address Manager (IPAM) pool.",
          type: "number",
          required: false,
        },
        Ipv6IpamPoolId: {
          name: "Ipv6Ipam Pool Id",
          description:
            "The ID of an IPv6 IPAM pool which will be used to allocate this VPC an IPv6 CIDR.",
          type: "string",
          required: false,
        },
        Ipv6NetmaskLength: {
          name: "Ipv6Netmask Length",
          description:
            "The netmask length of the IPv6 CIDR you want to allocate to this VPC from an Amazon VPC IP Address Manager (IPAM) pool.",
          type: "number",
          required: false,
        },
        Ipv6CidrBlockNetworkBorderGroup: {
          name: "Ipv6Cidr Block Network Border Group",
          description:
            "The name of the location from which we advertise the IPV6 CIDR block.",
          type: "string",
          required: false,
        },
        VpcEncryptionControl: {
          name: "Vpc Encryption Control",
          description:
            "Specifies the encryption control configuration to apply to the VPC during creation.",
          type: {
            type: "object",
            properties: {
              Mode: {
                type: "string",
                enum: ["monitor", "enforce"],
              },
              InternetGatewayExclusion: {
                type: "string",
                enum: ["enable", "disable"],
              },
              EgressOnlyInternetGatewayExclusion: {
                type: "string",
                enum: ["enable", "disable"],
              },
              NatGatewayExclusion: {
                type: "string",
                enum: ["enable", "disable"],
              },
              VirtualPrivateGatewayExclusion: {
                type: "string",
                enum: ["enable", "disable"],
              },
              VpcPeeringExclusion: {
                type: "string",
                enum: ["enable", "disable"],
              },
              LambdaExclusion: {
                type: "string",
                enum: ["enable", "disable"],
              },
              VpcLatticeExclusion: {
                type: "string",
                enum: ["enable", "disable"],
              },
              ElasticFileSystemExclusion: {
                type: "string",
                enum: ["enable", "disable"],
              },
            },
            required: ["Mode"],
            additionalProperties: false,
          },
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to assign to the VPC.",
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        InstanceTenancy: {
          name: "Instance Tenancy",
          description:
            "The tenancy options for instances launched into the VPC.",
          type: {
            type: "string",
            enum: ["default", "dedicated", "host"],
          },
          required: false,
        },
        AmazonProvidedIpv6CidrBlock: {
          name: "Amazon Provided Ipv6Cidr Block",
          description:
            "Requests an Amazon-provided IPv6 CIDR block with a /56 prefix length for the VPC.",
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

        const command = new CreateVpcCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Vpc Result",
      description: "Result from CreateVpc operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Vpc: {
            type: "object",
            properties: {
              OwnerId: {
                type: "string",
              },
              InstanceTenancy: {
                type: "string",
                enum: ["default", "dedicated", "host"],
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
                          type: "string",
                          enum: [
                            "associating",
                            "associated",
                            "disassociating",
                            "disassociated",
                            "failing",
                            "failed",
                          ],
                        },
                        StatusMessage: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                    NetworkBorderGroup: {
                      type: "string",
                    },
                    Ipv6Pool: {
                      type: "string",
                    },
                    Ipv6AddressAttribute: {
                      type: "string",
                      enum: ["public", "private"],
                    },
                    IpSource: {
                      type: "string",
                      enum: ["amazon", "byoip", "none"],
                    },
                  },
                  additionalProperties: false,
                },
              },
              CidrBlockAssociationSet: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AssociationId: {
                      type: "string",
                    },
                    CidrBlock: {
                      type: "string",
                    },
                    CidrBlockState: {
                      type: "object",
                      properties: {
                        State: {
                          type: "string",
                          enum: [
                            "associating",
                            "associated",
                            "disassociating",
                            "disassociated",
                            "failing",
                            "failed",
                          ],
                        },
                        StatusMessage: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              IsDefault: {
                type: "boolean",
              },
              EncryptionControl: {
                type: "object",
                properties: {
                  VpcId: {
                    type: "string",
                  },
                  VpcEncryptionControlId: {
                    type: "string",
                  },
                  Mode: {
                    type: "string",
                    enum: ["monitor", "enforce"],
                  },
                  State: {
                    type: "string",
                    enum: [
                      "enforce-in-progress",
                      "monitor-in-progress",
                      "enforce-failed",
                      "monitor-failed",
                      "deleting",
                      "deleted",
                      "available",
                      "creating",
                      "delete-failed",
                    ],
                  },
                  StateMessage: {
                    type: "string",
                  },
                  ResourceExclusions: {
                    type: "object",
                    properties: {
                      InternetGateway: {
                        type: "object",
                        properties: {
                          State: {
                            type: "string",
                            enum: [
                              "enabling",
                              "enabled",
                              "disabling",
                              "disabled",
                            ],
                          },
                          StateMessage: {
                            type: "string",
                          },
                        },
                        additionalProperties: false,
                      },
                      EgressOnlyInternetGateway: {
                        type: "object",
                        properties: {
                          State: {
                            type: "string",
                            enum: [
                              "enabling",
                              "enabled",
                              "disabling",
                              "disabled",
                            ],
                          },
                          StateMessage: {
                            type: "string",
                          },
                        },
                        additionalProperties: false,
                      },
                      NatGateway: {
                        type: "object",
                        properties: {
                          State: {
                            type: "string",
                            enum: [
                              "enabling",
                              "enabled",
                              "disabling",
                              "disabled",
                            ],
                          },
                          StateMessage: {
                            type: "string",
                          },
                        },
                        additionalProperties: false,
                      },
                      VirtualPrivateGateway: {
                        type: "object",
                        properties: {
                          State: {
                            type: "string",
                            enum: [
                              "enabling",
                              "enabled",
                              "disabling",
                              "disabled",
                            ],
                          },
                          StateMessage: {
                            type: "string",
                          },
                        },
                        additionalProperties: false,
                      },
                      VpcPeering: {
                        type: "object",
                        properties: {
                          State: {
                            type: "string",
                            enum: [
                              "enabling",
                              "enabled",
                              "disabling",
                              "disabled",
                            ],
                          },
                          StateMessage: {
                            type: "string",
                          },
                        },
                        additionalProperties: false,
                      },
                      Lambda: {
                        type: "object",
                        properties: {
                          State: {
                            type: "string",
                            enum: [
                              "enabling",
                              "enabled",
                              "disabling",
                              "disabled",
                            ],
                          },
                          StateMessage: {
                            type: "string",
                          },
                        },
                        additionalProperties: false,
                      },
                      VpcLattice: {
                        type: "object",
                        properties: {
                          State: {
                            type: "string",
                            enum: [
                              "enabling",
                              "enabled",
                              "disabling",
                              "disabled",
                            ],
                          },
                          StateMessage: {
                            type: "string",
                          },
                        },
                        additionalProperties: false,
                      },
                      ElasticFileSystem: {
                        type: "object",
                        properties: {
                          State: {
                            type: "string",
                            enum: [
                              "enabling",
                              "enabled",
                              "disabling",
                              "disabled",
                            ],
                          },
                          StateMessage: {
                            type: "string",
                          },
                        },
                        additionalProperties: false,
                      },
                    },
                    additionalProperties: false,
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
              BlockPublicAccessStates: {
                type: "object",
                properties: {
                  InternetGatewayBlockMode: {
                    type: "string",
                    enum: ["off", "block-bidirectional", "block-ingress"],
                  },
                },
                additionalProperties: false,
              },
              VpcId: {
                type: "string",
              },
              State: {
                type: "string",
                enum: ["pending", "available"],
              },
              CidrBlock: {
                type: "string",
              },
              DhcpOptionsId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the VPC.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createVpc;

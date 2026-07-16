import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateNatGatewayCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createNatGateway: AppBlock = {
  name: "Create Nat Gateway",
  description: `Creates a NAT gateway in the specified subnet.`,
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
        AvailabilityMode: {
          name: "Availability Mode",
          description:
            "Specifies whether to create a zonal (single-AZ) or regional (multi-AZ) NAT gateway.",
          type: {
            type: "string",
            enum: ["zonal", "regional"],
          },
          required: false,
        },
        AllocationId: {
          name: "Allocation Id",
          description:
            "[Public NAT gateways only] The allocation ID of an Elastic IP address to associate with the NAT gateway.",
          type: "string",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
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
        SubnetId: {
          name: "Subnet Id",
          description:
            "The ID of the subnet in which to create the NAT gateway.",
          type: "string",
          required: false,
        },
        VpcId: {
          name: "Vpc Id",
          description:
            "The ID of the VPC where you want to create a regional NAT gateway.",
          type: "string",
          required: false,
        },
        AvailabilityZoneAddresses: {
          name: "Availability Zone Addresses",
          description:
            "For regional NAT gateways only: Specifies which Availability Zones you want the NAT gateway to support and the Elastic IP addresses (EIPs) to use in each AZ.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AvailabilityZone: {
                  type: "string",
                },
                AvailabilityZoneId: {
                  type: "string",
                },
                AllocationIds: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to assign to the NAT gateway.",
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
        ConnectivityType: {
          name: "Connectivity Type",
          description:
            "Indicates whether the NAT gateway supports public or private connectivity.",
          type: {
            type: "string",
            enum: ["private", "public"],
          },
          required: false,
        },
        PrivateIpAddress: {
          name: "Private Ip Address",
          description: "The private IPv4 address to assign to the NAT gateway.",
          type: "string",
          required: false,
        },
        SecondaryAllocationIds: {
          name: "Secondary Allocation Ids",
          description: "Secondary EIP allocation IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        SecondaryPrivateIpAddresses: {
          name: "Secondary Private Ip Addresses",
          description: "Secondary private IPv4 addresses.",
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
            "[Private NAT gateway only] The number of secondary private IPv4 addresses you want to assign to the NAT gateway.",
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

        const command = new CreateNatGatewayCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Nat Gateway Result",
      description: "Result from CreateNatGateway operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ClientToken: {
            type: "string",
            description:
              "Unique, case-sensitive identifier to ensure the idempotency of the request.",
          },
          NatGateway: {
            type: "object",
            properties: {
              CreateTime: {
                type: "string",
              },
              DeleteTime: {
                type: "string",
              },
              FailureCode: {
                type: "string",
              },
              FailureMessage: {
                type: "string",
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
                      enum: [
                        "assigning",
                        "unassigning",
                        "associating",
                        "disassociating",
                        "succeeded",
                        "failed",
                      ],
                    },
                    AvailabilityZone: {
                      type: "string",
                    },
                    AvailabilityZoneId: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              NatGatewayId: {
                type: "string",
              },
              ProvisionedBandwidth: {
                type: "object",
                properties: {
                  ProvisionTime: {
                    type: "string",
                  },
                  Provisioned: {
                    type: "string",
                  },
                  RequestTime: {
                    type: "string",
                  },
                  Requested: {
                    type: "string",
                  },
                  Status: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              State: {
                type: "string",
                enum: ["pending", "failed", "available", "deleting", "deleted"],
              },
              SubnetId: {
                type: "string",
              },
              VpcId: {
                type: "string",
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
              ConnectivityType: {
                type: "string",
                enum: ["private", "public"],
              },
              AvailabilityMode: {
                type: "string",
                enum: ["zonal", "regional"],
              },
              AutoScalingIps: {
                type: "string",
                enum: ["enabled", "disabled"],
              },
              AutoProvisionZones: {
                type: "string",
                enum: ["enabled", "disabled"],
              },
              AttachedAppliances: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Type: {
                      type: "string",
                      enum: ["network-firewall-proxy"],
                    },
                    ApplianceArn: {
                      type: "string",
                    },
                    VpcEndpointId: {
                      type: "string",
                    },
                    AttachmentState: {
                      type: "string",
                      enum: [
                        "attaching",
                        "attached",
                        "detaching",
                        "detached",
                        "attach-failed",
                        "detach-failed",
                      ],
                    },
                    ModificationState: {
                      type: "string",
                      enum: ["modifying", "completed", "failed"],
                    },
                    FailureCode: {
                      type: "string",
                    },
                    FailureMessage: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              RouteTableId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the NAT gateway.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createNatGateway;

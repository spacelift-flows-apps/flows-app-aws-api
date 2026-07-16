import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateRouteTableCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createRouteTable: AppBlock = {
  name: "Create Route Table",
  description: `Creates a route table for the specified VPC.`,
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
          description: "The tags to assign to the route table.",
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        VpcId: {
          name: "Vpc Id",
          description: "The ID of the VPC.",
          type: "string",
          required: true,
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

        const command = new CreateRouteTableCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Route Table Result",
      description: "Result from CreateRouteTable operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RouteTable: {
            type: "object",
            properties: {
              Associations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Main: {
                      type: "boolean",
                    },
                    RouteTableAssociationId: {
                      type: "string",
                    },
                    RouteTableId: {
                      type: "string",
                    },
                    SubnetId: {
                      type: "string",
                    },
                    GatewayId: {
                      type: "string",
                    },
                    PublicIpv4Pool: {
                      type: "string",
                    },
                    AssociationState: {
                      type: "object",
                      properties: {
                        State: {
                          type: "string",
                          enum: [
                            "associating",
                            "associated",
                            "disassociating",
                            "disassociated",
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
              PropagatingVgws: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    GatewayId: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              RouteTableId: {
                type: "string",
              },
              Routes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DestinationCidrBlock: {
                      type: "string",
                    },
                    DestinationIpv6CidrBlock: {
                      type: "string",
                    },
                    DestinationPrefixListId: {
                      type: "string",
                    },
                    EgressOnlyInternetGatewayId: {
                      type: "string",
                    },
                    GatewayId: {
                      type: "string",
                    },
                    InstanceId: {
                      type: "string",
                    },
                    InstanceOwnerId: {
                      type: "string",
                    },
                    NatGatewayId: {
                      type: "string",
                    },
                    TransitGatewayId: {
                      type: "string",
                    },
                    LocalGatewayId: {
                      type: "string",
                    },
                    CarrierGatewayId: {
                      type: "string",
                    },
                    NetworkInterfaceId: {
                      type: "string",
                    },
                    Origin: {
                      type: "string",
                      enum: [
                        "CreateRouteTable",
                        "CreateRoute",
                        "EnableVgwRoutePropagation",
                        "Advertisement",
                      ],
                    },
                    State: {
                      type: "string",
                      enum: ["active", "blackhole", "filtered"],
                    },
                    VpcPeeringConnectionId: {
                      type: "string",
                    },
                    CoreNetworkArn: {
                      type: "string",
                    },
                    OdbNetworkArn: {
                      type: "string",
                    },
                    IpAddress: {
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
              VpcId: {
                type: "string",
              },
              OwnerId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the route table.",
          },
          ClientToken: {
            type: "string",
            description:
              "Unique, case-sensitive identifier to ensure the idempotency of the request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createRouteTable;

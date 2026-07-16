import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateVpnConnectionCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createVpnConnection: AppBlock = {
  name: "Create Vpn Connection",
  description: `Creates a VPN connection between an existing virtual private gateway or transit gateway and a customer gateway.`,
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
        CustomerGatewayId: {
          name: "Customer Gateway Id",
          description: "The ID of the customer gateway.",
          type: "string",
          required: true,
        },
        Type: {
          name: "Type",
          description: "The type of VPN connection (ipsec.",
          type: "string",
          required: true,
        },
        VpnGatewayId: {
          name: "Vpn Gateway Id",
          description: "The ID of the virtual private gateway.",
          type: "string",
          required: false,
        },
        TransitGatewayId: {
          name: "Transit Gateway Id",
          description: "The ID of the transit gateway.",
          type: "string",
          required: false,
        },
        VpnConcentratorId: {
          name: "Vpn Concentrator Id",
          description:
            "The ID of the VPN concentrator to associate with the VPN connection.",
          type: "string",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to apply to the VPN connection.",
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
        PreSharedKeyStorage: {
          name: "Pre Shared Key Storage",
          description:
            "Specifies the storage mode for the pre-shared key (PSK).",
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
        Options: {
          name: "Options",
          description: "The options for the VPN connection.",
          type: {
            type: "object",
            properties: {
              EnableAcceleration: {
                type: "boolean",
              },
              TunnelInsideIpVersion: {
                type: "string",
                enum: ["ipv4", "ipv6"],
              },
              TunnelOptions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    TunnelInsideCidr: {
                      type: "string",
                    },
                    TunnelInsideIpv6Cidr: {
                      type: "string",
                    },
                    PreSharedKey: {
                      type: "string",
                    },
                    Phase1LifetimeSeconds: {
                      type: "number",
                    },
                    Phase2LifetimeSeconds: {
                      type: "number",
                    },
                    RekeyMarginTimeSeconds: {
                      type: "number",
                    },
                    RekeyFuzzPercentage: {
                      type: "number",
                    },
                    ReplayWindowSize: {
                      type: "number",
                    },
                    DPDTimeoutSeconds: {
                      type: "number",
                    },
                    DPDTimeoutAction: {
                      type: "string",
                    },
                    Phase1EncryptionAlgorithms: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Value: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    Phase2EncryptionAlgorithms: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Value: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    Phase1IntegrityAlgorithms: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Value: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    Phase2IntegrityAlgorithms: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Value: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    Phase1DHGroupNumbers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Value: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    Phase2DHGroupNumbers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Value: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    IKEVersions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Value: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    StartupAction: {
                      type: "string",
                    },
                    LogOptions: {
                      type: "object",
                      properties: {
                        CloudWatchLogOptions: {
                          type: "object",
                          properties: {
                            LogEnabled: {},
                            LogGroupArn: {},
                            LogOutputFormat: {},
                            BgpLogEnabled: {},
                            BgpLogGroupArn: {},
                            BgpLogOutputFormat: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      additionalProperties: false,
                    },
                    EnableTunnelLifecycleControl: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
              },
              LocalIpv4NetworkCidr: {
                type: "string",
              },
              RemoteIpv4NetworkCidr: {
                type: "string",
              },
              LocalIpv6NetworkCidr: {
                type: "string",
              },
              RemoteIpv6NetworkCidr: {
                type: "string",
              },
              OutsideIpAddressType: {
                type: "string",
              },
              TransportTransitGatewayAttachmentId: {
                type: "string",
              },
              TunnelBandwidth: {
                type: "string",
                enum: ["standard", "large"],
              },
              StaticRoutesOnly: {
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

        const command = new CreateVpnConnectionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Vpn Connection Result",
      description: "Result from CreateVpnConnection operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          VpnConnection: {
            type: "object",
            properties: {
              Category: {
                type: "string",
              },
              TransitGatewayId: {
                type: "string",
              },
              VpnConcentratorId: {
                type: "string",
              },
              CoreNetworkArn: {
                type: "string",
              },
              CoreNetworkAttachmentArn: {
                type: "string",
              },
              GatewayAssociationState: {
                type: "string",
                enum: [
                  "associated",
                  "not-associated",
                  "associating",
                  "disassociating",
                ],
              },
              Options: {
                type: "object",
                properties: {
                  EnableAcceleration: {
                    type: "boolean",
                  },
                  StaticRoutesOnly: {
                    type: "boolean",
                  },
                  LocalIpv4NetworkCidr: {
                    type: "string",
                  },
                  RemoteIpv4NetworkCidr: {
                    type: "string",
                  },
                  LocalIpv6NetworkCidr: {
                    type: "string",
                  },
                  RemoteIpv6NetworkCidr: {
                    type: "string",
                  },
                  OutsideIpAddressType: {
                    type: "string",
                  },
                  TransportTransitGatewayAttachmentId: {
                    type: "string",
                  },
                  TunnelInsideIpVersion: {
                    type: "string",
                    enum: ["ipv4", "ipv6"],
                  },
                  TunnelOptions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        OutsideIpAddress: {
                          type: "string",
                        },
                        TunnelInsideCidr: {
                          type: "string",
                        },
                        TunnelInsideIpv6Cidr: {
                          type: "string",
                        },
                        PreSharedKey: {
                          type: "string",
                        },
                        Phase1LifetimeSeconds: {
                          type: "number",
                        },
                        Phase2LifetimeSeconds: {
                          type: "number",
                        },
                        RekeyMarginTimeSeconds: {
                          type: "number",
                        },
                        RekeyFuzzPercentage: {
                          type: "number",
                        },
                        ReplayWindowSize: {
                          type: "number",
                        },
                        DpdTimeoutSeconds: {
                          type: "number",
                        },
                        DpdTimeoutAction: {
                          type: "string",
                        },
                        Phase1EncryptionAlgorithms: {
                          type: "array",
                          items: {},
                        },
                        Phase2EncryptionAlgorithms: {
                          type: "array",
                          items: {},
                        },
                        Phase1IntegrityAlgorithms: {
                          type: "array",
                          items: {},
                        },
                        Phase2IntegrityAlgorithms: {
                          type: "array",
                          items: {},
                        },
                        Phase1DHGroupNumbers: {
                          type: "array",
                          items: {},
                        },
                        Phase2DHGroupNumbers: {
                          type: "array",
                          items: {},
                        },
                        IkeVersions: {
                          type: "array",
                          items: {},
                        },
                        StartupAction: {
                          type: "string",
                        },
                        LogOptions: {
                          type: "object",
                          properties: {
                            CloudWatchLogOptions: {},
                          },
                          additionalProperties: false,
                        },
                        EnableTunnelLifecycleControl: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  TunnelBandwidth: {
                    type: "string",
                    enum: ["standard", "large"],
                  },
                },
                additionalProperties: false,
              },
              Routes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DestinationCidrBlock: {
                      type: "string",
                    },
                    Source: {
                      type: "string",
                      enum: ["Static"],
                    },
                    State: {
                      type: "string",
                      enum: ["pending", "available", "deleting", "deleted"],
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
              VgwTelemetry: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AcceptedRouteCount: {
                      type: "number",
                    },
                    LastStatusChange: {
                      type: "string",
                    },
                    OutsideIpAddress: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                      enum: ["UP", "DOWN"],
                    },
                    StatusMessage: {
                      type: "string",
                    },
                    CertificateArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              PreSharedKeyArn: {
                type: "string",
              },
              VpnConnectionId: {
                type: "string",
              },
              State: {
                type: "string",
                enum: ["pending", "available", "deleting", "deleted"],
              },
              CustomerGatewayConfiguration: {
                type: "string",
              },
              Type: {
                type: "string",
                enum: ["ipsec.1"],
              },
              CustomerGatewayId: {
                type: "string",
              },
              VpnGatewayId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the VPN connection.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createVpnConnection;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  CreateVpcPeeringConnectionCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createVpcPeeringConnection: AppBlock = {
  name: "Create Vpc Peering Connection",
  description: `Requests a VPC peering connection between two VPCs: a requester VPC that you own and an accepter VPC with which to create the connection.`,
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
        PeerRegion: {
          name: "Peer Region",
          description:
            "The Region code for the accepter VPC, if the accepter VPC is located in a Region other than the Region in which you make the request.",
          type: "string",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to assign to the peering connection.",
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
        VpcId: {
          name: "Vpc Id",
          description: "The ID of the requester VPC.",
          type: "string",
          required: true,
        },
        PeerVpcId: {
          name: "Peer Vpc Id",
          description:
            "The ID of the VPC with which you are creating the VPC peering connection.",
          type: "string",
          required: false,
        },
        PeerOwnerId: {
          name: "Peer Owner Id",
          description:
            "The Amazon Web Services account ID of the owner of the accepter VPC.",
          type: "string",
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

        const command = new CreateVpcPeeringConnectionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Vpc Peering Connection Result",
      description: "Result from CreateVpcPeeringConnection operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          VpcPeeringConnection: {
            type: "object",
            properties: {
              AccepterVpcInfo: {
                type: "object",
                properties: {
                  CidrBlock: {
                    type: "string",
                  },
                  Ipv6CidrBlockSet: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Ipv6CidrBlock: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  CidrBlockSet: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        CidrBlock: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  OwnerId: {
                    type: "string",
                  },
                  PeeringOptions: {
                    type: "object",
                    properties: {
                      AllowDnsResolutionFromRemoteVpc: {
                        type: "boolean",
                      },
                      AllowEgressFromLocalClassicLinkToRemoteVpc: {
                        type: "boolean",
                      },
                      AllowEgressFromLocalVpcToRemoteClassicLink: {
                        type: "boolean",
                      },
                    },
                    additionalProperties: false,
                  },
                  VpcId: {
                    type: "string",
                  },
                  Region: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              ExpirationTime: {
                type: "string",
              },
              RequesterVpcInfo: {
                type: "object",
                properties: {
                  CidrBlock: {
                    type: "string",
                  },
                  Ipv6CidrBlockSet: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Ipv6CidrBlock: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  CidrBlockSet: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        CidrBlock: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  OwnerId: {
                    type: "string",
                  },
                  PeeringOptions: {
                    type: "object",
                    properties: {
                      AllowDnsResolutionFromRemoteVpc: {
                        type: "boolean",
                      },
                      AllowEgressFromLocalClassicLinkToRemoteVpc: {
                        type: "boolean",
                      },
                      AllowEgressFromLocalVpcToRemoteClassicLink: {
                        type: "boolean",
                      },
                    },
                    additionalProperties: false,
                  },
                  VpcId: {
                    type: "string",
                  },
                  Region: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              Status: {
                type: "object",
                properties: {
                  Code: {
                    type: "string",
                    enum: [
                      "initiating-request",
                      "pending-acceptance",
                      "active",
                      "deleted",
                      "rejected",
                      "failed",
                      "expired",
                      "provisioning",
                      "deleting",
                    ],
                  },
                  Message: {
                    type: "string",
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
              VpcPeeringConnectionId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the VPC peering connection.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createVpcPeeringConnection;

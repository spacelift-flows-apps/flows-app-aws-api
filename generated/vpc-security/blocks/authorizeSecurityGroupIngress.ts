import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  AuthorizeSecurityGroupIngressCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const authorizeSecurityGroupIngress: AppBlock = {
  name: "Authorize Security Group Ingress",
  description: `Adds the specified inbound (ingress) rules to a security group.`,
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
        CidrIp: {
          name: "Cidr Ip",
          description: "The IPv4 address range, in CIDR format.",
          type: "string",
          required: false,
        },
        FromPort: {
          name: "From Port",
          description:
            "If the protocol is TCP or UDP, this is the start of the port range.",
          type: "number",
          required: false,
        },
        GroupId: {
          name: "Group Id",
          description: "The ID of the security group.",
          type: "string",
          required: false,
        },
        GroupName: {
          name: "Group Name",
          description: "[Default VPC] The name of the security group.",
          type: "string",
          required: false,
        },
        IpPermissions: {
          name: "Ip Permissions",
          description: "The permissions for the security group rules.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                IpProtocol: {
                  type: "string",
                },
                FromPort: {
                  type: "number",
                },
                ToPort: {
                  type: "number",
                },
                UserIdGroupPairs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Description: {
                        type: "string",
                      },
                      UserId: {
                        type: "string",
                      },
                      GroupName: {
                        type: "string",
                      },
                      GroupId: {
                        type: "string",
                      },
                      VpcId: {
                        type: "string",
                      },
                      VpcPeeringConnectionId: {
                        type: "string",
                      },
                      PeeringStatus: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                IpRanges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Description: {
                        type: "string",
                      },
                      CidrIp: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                Ipv6Ranges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Description: {
                        type: "string",
                      },
                      CidrIpv6: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                PrefixListIds: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Description: {
                        type: "string",
                      },
                      PrefixListId: {
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
        IpProtocol: {
          name: "Ip Protocol",
          description:
            "The IP protocol name (tcp, udp, icmp) or number (see Protocol Numbers).",
          type: "string",
          required: false,
        },
        SourceSecurityGroupName: {
          name: "Source Security Group Name",
          description: "[Default VPC] The name of the source security group.",
          type: "string",
          required: false,
        },
        SourceSecurityGroupOwnerId: {
          name: "Source Security Group Owner Id",
          description:
            "The Amazon Web Services account ID for the source security group, if the source security group is in a different account.",
          type: "string",
          required: false,
        },
        ToPort: {
          name: "To Port",
          description:
            "If the protocol is TCP or UDP, this is the end of the port range.",
          type: "number",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags applied to the security group rule.",
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

        const command = new AuthorizeSecurityGroupIngressCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Authorize Security Group Ingress Result",
      description: "Result from AuthorizeSecurityGroupIngress operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Return: {
            type: "boolean",
            description:
              "Returns true if the request succeeds; otherwise, returns an error.",
          },
          SecurityGroupRules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                SecurityGroupRuleId: {
                  type: "string",
                },
                GroupId: {
                  type: "string",
                },
                GroupOwnerId: {
                  type: "string",
                },
                IsEgress: {
                  type: "boolean",
                },
                IpProtocol: {
                  type: "string",
                },
                FromPort: {
                  type: "number",
                },
                ToPort: {
                  type: "number",
                },
                CidrIpv4: {
                  type: "string",
                },
                CidrIpv6: {
                  type: "string",
                },
                PrefixListId: {
                  type: "string",
                },
                ReferencedGroupInfo: {
                  type: "object",
                  properties: {
                    GroupId: {
                      type: "string",
                    },
                    PeeringStatus: {
                      type: "string",
                    },
                    UserId: {
                      type: "string",
                    },
                    VpcId: {
                      type: "string",
                    },
                    VpcPeeringConnectionId: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                Description: {
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
                SecurityGroupRuleArn: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the inbound (ingress) security group rules that were added.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default authorizeSecurityGroupIngress;

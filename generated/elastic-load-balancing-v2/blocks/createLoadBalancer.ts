import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingV2Client,
  CreateLoadBalancerCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createLoadBalancer: AppBlock = {
  name: "Create Load Balancer",
  description: `Creates an Application Load Balancer, Network Load Balancer, or Gateway Load Balancer.`,
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
        Name: {
          name: "Name",
          description: "The name of the load balancer.",
          type: "string",
          required: true,
        },
        Subnets: {
          name: "Subnets",
          description: "The IDs of the subnets.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        SubnetMappings: {
          name: "Subnet Mappings",
          description: "The IDs of the subnets.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                SubnetId: {
                  type: "string",
                },
                AllocationId: {
                  type: "string",
                },
                PrivateIPv4Address: {
                  type: "string",
                },
                IPv6Address: {
                  type: "string",
                },
                SourceNatIpv6Prefix: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        SecurityGroups: {
          name: "Security Groups",
          description:
            "[Application Load Balancers and Network Load Balancers] The IDs of the security groups for the load balancer.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Scheme: {
          name: "Scheme",
          description:
            "The nodes of an Internet-facing load balancer have public IP addresses.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "The tags to assign to the load balancer.",
          type: {
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
              required: ["Key"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Type: {
          name: "Type",
          description: "The type of load balancer.",
          type: "string",
          required: false,
        },
        IpAddressType: {
          name: "Ip Address Type",
          description: "The IP address type.",
          type: "string",
          required: false,
        },
        CustomerOwnedIpv4Pool: {
          name: "Customer Owned Ipv4Pool",
          description:
            "[Application Load Balancers on Outposts] The ID of the customer-owned address pool (CoIP pool).",
          type: "string",
          required: false,
        },
        EnablePrefixForIpv6SourceNat: {
          name: "Enable Prefix For Ipv6Source Nat",
          description:
            "[Network Load Balancers with UDP listeners] Indicates whether to use an IPv6 prefix from each subnet for source NAT.",
          type: "string",
          required: false,
        },
        IpamPools: {
          name: "Ipam Pools",
          description:
            "[Application Load Balancers] The IPAM pools to use with the load balancer.",
          type: {
            type: "object",
            properties: {
              Ipv4IpamPoolId: {
                type: "string",
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

        const client = new ElasticLoadBalancingV2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateLoadBalancerCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Load Balancer Result",
      description: "Result from CreateLoadBalancer operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          LoadBalancers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                LoadBalancerArn: {
                  type: "string",
                },
                DNSName: {
                  type: "string",
                },
                CanonicalHostedZoneId: {
                  type: "string",
                },
                CreatedTime: {
                  type: "string",
                },
                LoadBalancerName: {
                  type: "string",
                },
                Scheme: {
                  type: "string",
                },
                VpcId: {
                  type: "string",
                },
                State: {
                  type: "object",
                  properties: {
                    Code: {
                      type: "string",
                    },
                    Reason: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                Type: {
                  type: "string",
                },
                AvailabilityZones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ZoneName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SubnetId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      OutpostId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      LoadBalancerAddresses: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SourceNatIpv6Prefixes: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                SecurityGroups: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                IpAddressType: {
                  type: "string",
                },
                CustomerOwnedIpv4Pool: {
                  type: "string",
                },
                EnforceSecurityGroupInboundRulesOnPrivateLinkTraffic: {
                  type: "string",
                },
                EnablePrefixForIpv6SourceNat: {
                  type: "string",
                },
                IpamPools: {
                  type: "object",
                  properties: {
                    Ipv4IpamPoolId: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "Information about the load balancer.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createLoadBalancer;

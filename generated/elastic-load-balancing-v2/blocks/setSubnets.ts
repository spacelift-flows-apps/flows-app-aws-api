import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingv2Client,
  SetSubnetsCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const setSubnets: AppBlock = {
  name: "Set Subnets",
  description: `Enables the Availability Zones for the specified public subnets for the specified Application Load Balancer, Network Load Balancer or Gateway Load Balancer.`,
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
        LoadBalancerArn: {
          name: "Load Balancer Arn",
          description: "The Amazon Resource Name (ARN) of the load balancer.",
          type: "string",
          required: true,
        },
        Subnets: {
          name: "Subnets",
          description: "The IDs of the public subnets.",
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
          description: "The IDs of the public subnets.",
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
        IpAddressType: {
          name: "Ip Address Type",
          description: "The IP address type.",
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

        const client = new ElasticLoadBalancingv2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new SetSubnetsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Set Subnets Result",
      description: "Result from SetSubnets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AvailabilityZones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ZoneName: {
                  type: "string",
                },
                SubnetId: {
                  type: "string",
                },
                OutpostId: {
                  type: "string",
                },
                LoadBalancerAddresses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      IpAddress: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AllocationId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PrivateIPv4Address: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IPv6Address: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                SourceNatIpv6Prefixes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description: "Information about the subnets.",
          },
          IpAddressType: {
            type: "string",
            description: "The IP address type.",
          },
          EnablePrefixForIpv6SourceNat: {
            type: "string",
            description:
              "[Network Load Balancers] Indicates whether to use an IPv6 prefix from each subnet for source NAT.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default setSubnets;

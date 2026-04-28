import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingv2Client,
  DescribeLoadBalancersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeLoadBalancers: AppBlock = {
  name: "Describe Load Balancers",
  description: `Describes the specified load balancers or all of your load balancers.`,
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
        LoadBalancerArns: {
          name: "Load Balancer Arns",
          description: "The Amazon Resource Names (ARN) of the load balancers.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Names: {
          name: "Names",
          description: "The names of the load balancers.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Marker: {
          name: "Marker",
          description: "The marker for the next set of results.",
          type: "string",
          required: false,
        },
        PageSize: {
          name: "Page Size",
          description:
            "The maximum number of results to return with this call.",
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

        const client = new ElasticLoadBalancingv2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeLoadBalancersCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Load Balancers Result",
      description: "Result from DescribeLoadBalancers operation",
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
            description: "Information about the load balancers.",
          },
          NextMarker: {
            type: "string",
            description:
              "If there are additional results, this is the marker for the next set of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeLoadBalancers;

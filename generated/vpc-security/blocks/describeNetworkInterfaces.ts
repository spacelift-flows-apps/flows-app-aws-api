import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeNetworkInterfacesCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeNetworkInterfaces: AppBlock = {
  name: "Describe Network Interfaces",
  description: `Describes the specified network interfaces or all your network interfaces.`,
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
        NextToken: {
          name: "Next Token",
          description: "The token returned from a previous paginated request.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of items to return for this request.",
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
        NetworkInterfaceIds: {
          name: "Network Interface Ids",
          description: "The network interface IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "One or more filters.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Values: {
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
            credentials: {
              accessKeyId: input.app.config.accessKeyId,
              secretAccessKey: input.app.config.secretAccessKey,
              sessionToken: input.app.config.sessionToken,
            },
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

        const command = new DescribeNetworkInterfacesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Network Interfaces Result",
      description: "Result from DescribeNetworkInterfaces operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NetworkInterfaces: {
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
                    },
                    EnaSrdSpecification: {
                      type: "object",
                      properties: {
                        EnaSrdEnabled: {
                          type: "object",
                          additionalProperties: true,
                        },
                        EnaSrdUdpSpecification: {
                          type: "object",
                          additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      GroupName: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                InterfaceType: {
                  type: "string",
                },
                Ipv6Addresses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Ipv6Address: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PublicIpv6DnsName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IsPrimaryIpv6: {
                        type: "object",
                        additionalProperties: true,
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
                        additionalProperties: true,
                      },
                      Primary: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PrivateDnsName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PrivateIpAddress: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
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
                  },
                  additionalProperties: false,
                },
                AssociatedSubnets: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description: "Information about the network interfaces.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeNetworkInterfaces;

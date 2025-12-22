import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateVpcEndpointCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createVpcEndpoint: AppBlock = {
  name: "Create Vpc Endpoint",
  description: `Creates a VPC endpoint.`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        VpcEndpointType: {
          name: "Vpc Endpoint Type",
          description: "The type of endpoint.",
          type: "string",
          required: false,
        },
        VpcId: {
          name: "Vpc Id",
          description: "The ID of the VPC.",
          type: "string",
          required: true,
        },
        ServiceName: {
          name: "Service Name",
          description: "The name of the endpoint service.",
          type: "string",
          required: false,
        },
        PolicyDocument: {
          name: "Policy Document",
          description:
            "(Interface and gateway endpoints) A policy to attach to the endpoint that controls access to the service.",
          type: "string",
          required: false,
        },
        RouteTableIds: {
          name: "Route Table Ids",
          description: "(Gateway endpoint) The route table IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        SubnetIds: {
          name: "Subnet Ids",
          description:
            "(Interface and Gateway Load Balancer endpoints) The IDs of the subnets in which to create endpoint network interfaces.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        SecurityGroupIds: {
          name: "Security Group Ids",
          description:
            "(Interface endpoint) The IDs of the security groups to associate with the endpoint network interfaces.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        IpAddressType: {
          name: "Ip Address Type",
          description: "The IP address type for the endpoint.",
          type: "string",
          required: false,
        },
        DnsOptions: {
          name: "Dns Options",
          description: "The DNS options for the endpoint.",
          type: {
            type: "object",
            properties: {
              DnsRecordIpType: {
                type: "string",
              },
              PrivateDnsOnlyForInboundResolverEndpoint: {
                type: "boolean",
              },
            },
            additionalProperties: false,
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
        PrivateDnsEnabled: {
          name: "Private Dns Enabled",
          description:
            "(Interface endpoint) Indicates whether to associate a private hosted zone with the specified VPC.",
          type: "boolean",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to associate with the endpoint.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ResourceType: {
                  type: "string",
                },
                Tags: {
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
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        SubnetConfigurations: {
          name: "Subnet Configurations",
          description: "The subnet configurations for the endpoint.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                SubnetId: {
                  type: "string",
                },
                Ipv4: {
                  type: "string",
                },
                Ipv6: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        ServiceNetworkArn: {
          name: "Service Network Arn",
          description:
            "The Amazon Resource Name (ARN) of a service network that will be associated with the VPC endpoint of type service-network.",
          type: "string",
          required: false,
        },
        ResourceConfigurationArn: {
          name: "Resource Configuration Arn",
          description:
            "The Amazon Resource Name (ARN) of a resource configuration that will be associated with the VPC endpoint of type resource.",
          type: "string",
          required: false,
        },
        ServiceRegion: {
          name: "Service Region",
          description: "The Region where the service is hosted.",
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

        const command = new CreateVpcEndpointCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Vpc Endpoint Result",
      description: "Result from CreateVpcEndpoint operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          VpcEndpoint: {
            type: "object",
            properties: {
              VpcEndpointId: {
                type: "string",
              },
              VpcEndpointType: {
                type: "string",
              },
              VpcId: {
                type: "string",
              },
              ServiceName: {
                type: "string",
              },
              State: {
                type: "string",
              },
              PolicyDocument: {
                type: "string",
              },
              RouteTableIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              SubnetIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              Groups: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    GroupId: {
                      type: "string",
                    },
                    GroupName: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              IpAddressType: {
                type: "string",
              },
              DnsOptions: {
                type: "object",
                properties: {
                  DnsRecordIpType: {
                    type: "string",
                  },
                  PrivateDnsOnlyForInboundResolverEndpoint: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              PrivateDnsEnabled: {
                type: "boolean",
              },
              RequesterManaged: {
                type: "boolean",
              },
              NetworkInterfaceIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              DnsEntries: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DnsName: {
                      type: "string",
                    },
                    HostedZoneId: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              CreationTimestamp: {
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
              OwnerId: {
                type: "string",
              },
              LastError: {
                type: "object",
                properties: {
                  Message: {
                    type: "string",
                  },
                  Code: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              Ipv4Prefixes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    SubnetId: {
                      type: "string",
                    },
                    IpPrefixes: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
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
                    SubnetId: {
                      type: "string",
                    },
                    IpPrefixes: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              FailureReason: {
                type: "string",
              },
              ServiceNetworkArn: {
                type: "string",
              },
              ResourceConfigurationArn: {
                type: "string",
              },
              ServiceRegion: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the endpoint.",
          },
          ClientToken: {
            type: "string",
            description:
              "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createVpcEndpoint;

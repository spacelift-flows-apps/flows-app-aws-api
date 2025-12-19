import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateVpcCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createVpc: AppBlock = {
  name: "Create Vpc",
  description: `Creates a VPC with the specified CIDR blocks.`,
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
        CidrBlock: {
          name: "Cidr Block",
          description: "The IPv4 network range for the VPC, in CIDR notation.",
          type: "string",
          required: false,
        },
        Ipv6Pool: {
          name: "Ipv6Pool",
          description:
            "The ID of an IPv6 address pool from which to allocate the IPv6 CIDR block.",
          type: "string",
          required: false,
        },
        Ipv6CidrBlock: {
          name: "Ipv6Cidr Block",
          description: "The IPv6 CIDR block from the IPv6 address pool.",
          type: "string",
          required: false,
        },
        Ipv4IpamPoolId: {
          name: "Ipv4Ipam Pool Id",
          description:
            "The ID of an IPv4 IPAM pool you want to use for allocating this VPC's CIDR.",
          type: "string",
          required: false,
        },
        Ipv4NetmaskLength: {
          name: "Ipv4Netmask Length",
          description:
            "The netmask length of the IPv4 CIDR you want to allocate to this VPC from an Amazon VPC IP Address Manager (IPAM) pool.",
          type: "number",
          required: false,
        },
        Ipv6IpamPoolId: {
          name: "Ipv6Ipam Pool Id",
          description:
            "The ID of an IPv6 IPAM pool which will be used to allocate this VPC an IPv6 CIDR.",
          type: "string",
          required: false,
        },
        Ipv6NetmaskLength: {
          name: "Ipv6Netmask Length",
          description:
            "The netmask length of the IPv6 CIDR you want to allocate to this VPC from an Amazon VPC IP Address Manager (IPAM) pool.",
          type: "number",
          required: false,
        },
        Ipv6CidrBlockNetworkBorderGroup: {
          name: "Ipv6Cidr Block Network Border Group",
          description:
            "The name of the location from which we advertise the IPV6 CIDR block.",
          type: "string",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to assign to the VPC.",
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        InstanceTenancy: {
          name: "Instance Tenancy",
          description:
            "The tenancy options for instances launched into the VPC.",
          type: "string",
          required: false,
        },
        AmazonProvidedIpv6CidrBlock: {
          name: "Amazon Provided Ipv6Cidr Block",
          description:
            "Requests an Amazon-provided IPv6 CIDR block with a /56 prefix length for the VPC.",
          type: "boolean",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateVpcCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Vpc Result",
      description: "Result from CreateVpc operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Vpc: {
            type: "object",
            properties: {
              OwnerId: {
                type: "string",
              },
              InstanceTenancy: {
                type: "string",
              },
              Ipv6CidrBlockAssociationSet: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AssociationId: {
                      type: "string",
                    },
                    Ipv6CidrBlock: {
                      type: "string",
                    },
                    Ipv6CidrBlockState: {
                      type: "object",
                      properties: {
                        State: {
                          type: "object",
                          additionalProperties: true,
                        },
                        StatusMessage: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    NetworkBorderGroup: {
                      type: "string",
                    },
                    Ipv6Pool: {
                      type: "string",
                    },
                    Ipv6AddressAttribute: {
                      type: "string",
                    },
                    IpSource: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              CidrBlockAssociationSet: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AssociationId: {
                      type: "string",
                    },
                    CidrBlock: {
                      type: "string",
                    },
                    CidrBlockState: {
                      type: "object",
                      properties: {
                        State: {
                          type: "object",
                          additionalProperties: true,
                        },
                        StatusMessage: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              IsDefault: {
                type: "boolean",
              },
              EncryptionControl: {
                type: "object",
                properties: {
                  VpcId: {
                    type: "string",
                  },
                  VpcEncryptionControlId: {
                    type: "string",
                  },
                  Mode: {
                    type: "string",
                  },
                  State: {
                    type: "string",
                  },
                  StateMessage: {
                    type: "string",
                  },
                  ResourceExclusions: {
                    type: "object",
                    properties: {
                      InternetGateway: {
                        type: "object",
                        properties: {
                          State: {
                            type: "object",
                            additionalProperties: true,
                          },
                          StateMessage: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      EgressOnlyInternetGateway: {
                        type: "object",
                        properties: {
                          State: {
                            type: "object",
                            additionalProperties: true,
                          },
                          StateMessage: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      NatGateway: {
                        type: "object",
                        properties: {
                          State: {
                            type: "object",
                            additionalProperties: true,
                          },
                          StateMessage: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      VirtualPrivateGateway: {
                        type: "object",
                        properties: {
                          State: {
                            type: "object",
                            additionalProperties: true,
                          },
                          StateMessage: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      VpcPeering: {
                        type: "object",
                        properties: {
                          State: {
                            type: "object",
                            additionalProperties: true,
                          },
                          StateMessage: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
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
              BlockPublicAccessStates: {
                type: "object",
                properties: {
                  InternetGatewayBlockMode: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              VpcId: {
                type: "string",
              },
              State: {
                type: "string",
              },
              CidrBlock: {
                type: "string",
              },
              DhcpOptionsId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the VPC.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createVpc;

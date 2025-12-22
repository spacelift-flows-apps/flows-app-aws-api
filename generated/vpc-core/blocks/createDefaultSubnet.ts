import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateDefaultSubnetCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createDefaultSubnet: AppBlock = {
  name: "Create Default Subnet",
  description: `Creates a default subnet with a size /20 IPv4 CIDR block in the specified Availability Zone in your default VPC.`,
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
        AvailabilityZone: {
          name: "Availability Zone",
          description:
            "The Availability Zone in which to create the default subnet.",
          type: "string",
          required: true,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        Ipv6Native: {
          name: "Ipv6Native",
          description: "Indicates whether to create an IPv6 only subnet.",
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

        const command = new CreateDefaultSubnetCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Default Subnet Result",
      description: "Result from CreateDefaultSubnet operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Subnet: {
            type: "object",
            properties: {
              AvailabilityZoneId: {
                type: "string",
              },
              EnableLniAtDeviceIndex: {
                type: "number",
              },
              MapCustomerOwnedIpOnLaunch: {
                type: "boolean",
              },
              CustomerOwnedIpv4Pool: {
                type: "string",
              },
              OwnerId: {
                type: "string",
              },
              AssignIpv6AddressOnCreation: {
                type: "boolean",
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
              SubnetArn: {
                type: "string",
              },
              OutpostArn: {
                type: "string",
              },
              EnableDns64: {
                type: "boolean",
              },
              Ipv6Native: {
                type: "boolean",
              },
              PrivateDnsNameOptionsOnLaunch: {
                type: "object",
                properties: {
                  HostnameType: {
                    type: "string",
                  },
                  EnableResourceNameDnsARecord: {
                    type: "boolean",
                  },
                  EnableResourceNameDnsAAAARecord: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
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
              Type: {
                type: "string",
              },
              SubnetId: {
                type: "string",
              },
              State: {
                type: "string",
              },
              VpcId: {
                type: "string",
              },
              CidrBlock: {
                type: "string",
              },
              AvailableIpAddressCount: {
                type: "number",
              },
              AvailabilityZone: {
                type: "string",
              },
              DefaultForAz: {
                type: "boolean",
              },
              MapPublicIpOnLaunch: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description: "Information about the subnet.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createDefaultSubnet;

import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, AssociateVpcCidrBlockCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const associateVpcCidrBlock: AppBlock = {
  name: "Associate Vpc Cidr Block",
  description: `Associates a CIDR block with your VPC.`,
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
          description: "An IPv4 CIDR block to associate with the VPC.",
          type: "string",
          required: false,
        },
        Ipv6CidrBlockNetworkBorderGroup: {
          name: "Ipv6Cidr Block Network Border Group",
          description:
            "The name of the location from which we advertise the IPV6 CIDR block.",
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
          description: "An IPv6 CIDR block from the IPv6 address pool.",
          type: "string",
          required: false,
        },
        Ipv4IpamPoolId: {
          name: "Ipv4Ipam Pool Id",
          description:
            "Associate a CIDR allocated from an IPv4 IPAM pool to a VPC.",
          type: "string",
          required: false,
        },
        Ipv4NetmaskLength: {
          name: "Ipv4Netmask Length",
          description:
            "The netmask length of the IPv4 CIDR you would like to associate from an Amazon VPC IP Address Manager (IPAM) pool.",
          type: "number",
          required: false,
        },
        Ipv6IpamPoolId: {
          name: "Ipv6Ipam Pool Id",
          description:
            "Associates a CIDR allocated from an IPv6 IPAM pool to a VPC.",
          type: "string",
          required: false,
        },
        Ipv6NetmaskLength: {
          name: "Ipv6Netmask Length",
          description:
            "The netmask length of the IPv6 CIDR you would like to associate from an Amazon VPC IP Address Manager (IPAM) pool.",
          type: "number",
          required: false,
        },
        VpcId: {
          name: "Vpc Id",
          description: "The ID of the VPC.",
          type: "string",
          required: true,
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

        const command = new AssociateVpcCidrBlockCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Associate Vpc Cidr Block Result",
      description: "Result from AssociateVpcCidrBlock operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Ipv6CidrBlockAssociation: {
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
                    type: "string",
                  },
                  StatusMessage: {
                    type: "string",
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
            description: "Information about the IPv6 CIDR block association.",
          },
          CidrBlockAssociation: {
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
                    type: "string",
                  },
                  StatusMessage: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "Information about the IPv4 CIDR block association.",
          },
          VpcId: {
            type: "string",
            description: "The ID of the VPC.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default associateVpcCidrBlock;

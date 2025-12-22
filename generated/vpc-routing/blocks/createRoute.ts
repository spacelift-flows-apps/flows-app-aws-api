import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateRouteCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createRoute: AppBlock = {
  name: "Create Route",
  description: `Creates a route in a route table within a VPC.`,
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
        DestinationPrefixListId: {
          name: "Destination Prefix List Id",
          description:
            "The ID of a prefix list used for the destination match.",
          type: "string",
          required: false,
        },
        VpcEndpointId: {
          name: "Vpc Endpoint Id",
          description: "The ID of a VPC endpoint.",
          type: "string",
          required: false,
        },
        TransitGatewayId: {
          name: "Transit Gateway Id",
          description: "The ID of a transit gateway.",
          type: "string",
          required: false,
        },
        LocalGatewayId: {
          name: "Local Gateway Id",
          description: "The ID of the local gateway.",
          type: "string",
          required: false,
        },
        CarrierGatewayId: {
          name: "Carrier Gateway Id",
          description: "The ID of the carrier gateway.",
          type: "string",
          required: false,
        },
        CoreNetworkArn: {
          name: "Core Network Arn",
          description: "The Amazon Resource Name (ARN) of the core network.",
          type: "string",
          required: false,
        },
        OdbNetworkArn: {
          name: "Odb Network Arn",
          description: "The Amazon Resource Name (ARN) of the ODB network.",
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
        RouteTableId: {
          name: "Route Table Id",
          description: "The ID of the route table for the route.",
          type: "string",
          required: true,
        },
        DestinationCidrBlock: {
          name: "Destination Cidr Block",
          description:
            "The IPv4 CIDR address block used for the destination match.",
          type: "string",
          required: false,
        },
        GatewayId: {
          name: "Gateway Id",
          description:
            "The ID of an internet gateway or virtual private gateway attached to your VPC.",
          type: "string",
          required: false,
        },
        DestinationIpv6CidrBlock: {
          name: "Destination Ipv6Cidr Block",
          description: "The IPv6 CIDR block used for the destination match.",
          type: "string",
          required: false,
        },
        EgressOnlyInternetGatewayId: {
          name: "Egress Only Internet Gateway Id",
          description:
            "[IPv6 traffic only] The ID of an egress-only internet gateway.",
          type: "string",
          required: false,
        },
        InstanceId: {
          name: "Instance Id",
          description: "The ID of a NAT instance in your VPC.",
          type: "string",
          required: false,
        },
        NetworkInterfaceId: {
          name: "Network Interface Id",
          description: "The ID of a network interface.",
          type: "string",
          required: false,
        },
        VpcPeeringConnectionId: {
          name: "Vpc Peering Connection Id",
          description: "The ID of a VPC peering connection.",
          type: "string",
          required: false,
        },
        NatGatewayId: {
          name: "Nat Gateway Id",
          description: "[IPv4 traffic only] The ID of a NAT gateway.",
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

        const command = new CreateRouteCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Route Result",
      description: "Result from CreateRoute operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Return: {
            type: "boolean",
            description:
              "Returns true if the request succeeds; otherwise, it returns an error.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createRoute;

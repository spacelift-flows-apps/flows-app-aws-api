import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, ModifyVpcEndpointCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyVpcEndpoint: AppBlock = {
  name: "Modify Vpc Endpoint",
  description: `Modifies attributes of a specified VPC endpoint.`,
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
        VpcEndpointId: {
          name: "Vpc Endpoint Id",
          description: "The ID of the endpoint.",
          type: "string",
          required: true,
        },
        ResetPolicy: {
          name: "Reset Policy",
          description:
            "(Gateway endpoint) Specify true to reset the policy document to the default policy.",
          type: "boolean",
          required: false,
        },
        PolicyDocument: {
          name: "Policy Document",
          description:
            "(Interface and gateway endpoints) A policy to attach to the endpoint that controls access to the service.",
          type: "string",
          required: false,
        },
        AddRouteTableIds: {
          name: "Add Route Table Ids",
          description:
            "(Gateway endpoint) The IDs of the route tables to associate with the endpoint.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        RemoveRouteTableIds: {
          name: "Remove Route Table Ids",
          description:
            "(Gateway endpoint) The IDs of the route tables to disassociate from the endpoint.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AddSubnetIds: {
          name: "Add Subnet Ids",
          description:
            "(Interface and Gateway Load Balancer endpoints) The IDs of the subnets in which to serve the endpoint.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        RemoveSubnetIds: {
          name: "Remove Subnet Ids",
          description:
            "(Interface endpoint) The IDs of the subnets from which to remove the endpoint.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AddSecurityGroupIds: {
          name: "Add Security Group Ids",
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
        RemoveSecurityGroupIds: {
          name: "Remove Security Group Ids",
          description:
            "(Interface endpoint) The IDs of the security groups to disassociate from the endpoint network interfaces.",
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
        PrivateDnsEnabled: {
          name: "Private Dns Enabled",
          description:
            "(Interface endpoint) Indicates whether a private hosted zone is associated with the VPC.",
          type: "boolean",
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

        const command = new ModifyVpcEndpointCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Vpc Endpoint Result",
      description: "Result from ModifyVpcEndpoint operation",
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

export default modifyVpcEndpoint;

import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, AllocateAddressCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const allocateAddress: AppBlock = {
  name: "Allocate Address",
  description: `Allocates an Elastic IP address to your Amazon Web Services account.`,
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
        Domain: {
          name: "Domain",
          description: "The network (vpc).",
          type: "string",
          required: false,
        },
        Address: {
          name: "Address",
          description:
            "The Elastic IP address to recover or an IPv4 address from an address pool.",
          type: "string",
          required: false,
        },
        PublicIpv4Pool: {
          name: "Public Ipv4Pool",
          description: "The ID of an address pool that you own.",
          type: "string",
          required: false,
        },
        NetworkBorderGroup: {
          name: "Network Border Group",
          description:
            "A unique set of Availability Zones, Local Zones, or Wavelength Zones from which Amazon Web Services advertises IP addresses.",
          type: "string",
          required: false,
        },
        CustomerOwnedIpv4Pool: {
          name: "Customer Owned Ipv4Pool",
          description: "The ID of a customer-owned address pool.",
          type: "string",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to assign to the Elastic IP address.",
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
        IpamPoolId: {
          name: "Ipam Pool Id",
          description:
            "The ID of an IPAM pool which has an Amazon-provided or BYOIP public IPv4 CIDR provisioned to it.",
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

        const command = new AllocateAddressCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Allocate Address Result",
      description: "Result from AllocateAddress operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AllocationId: {
            type: "string",
            description:
              "The ID that represents the allocation of the Elastic IP address.",
          },
          PublicIpv4Pool: {
            type: "string",
            description: "The ID of an address pool.",
          },
          NetworkBorderGroup: {
            type: "string",
            description:
              "The set of Availability Zones, Local Zones, or Wavelength Zones from which Amazon Web Services advertises IP addresses.",
          },
          Domain: {
            type: "string",
            description: "The network (vpc).",
          },
          CustomerOwnedIp: {
            type: "string",
            description: "The customer-owned IP address.",
          },
          CustomerOwnedIpv4Pool: {
            type: "string",
            description: "The ID of the customer-owned address pool.",
          },
          CarrierIp: {
            type: "string",
            description: "The carrier IP address.",
          },
          PublicIp: {
            type: "string",
            description: "The Elastic IP address.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default allocateAddress;

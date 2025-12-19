import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeAddressesCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAddresses: AppBlock = {
  name: "Describe Addresses",
  description: `Describes the specified Elastic IP addresses or all of your Elastic IP addresses.`,
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
        PublicIps: {
          name: "Public Ips",
          description: "One or more Elastic IP addresses.",
          type: {
            type: "array",
            items: {
              type: "string",
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
        AllocationIds: {
          name: "Allocation Ids",
          description: "Information about the allocation IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
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

        const command = new DescribeAddressesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Addresses Result",
      description: "Result from DescribeAddresses operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Addresses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AllocationId: {
                  type: "string",
                },
                AssociationId: {
                  type: "string",
                },
                Domain: {
                  type: "string",
                },
                NetworkInterfaceId: {
                  type: "string",
                },
                NetworkInterfaceOwnerId: {
                  type: "string",
                },
                PrivateIpAddress: {
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
                PublicIpv4Pool: {
                  type: "string",
                },
                NetworkBorderGroup: {
                  type: "string",
                },
                CustomerOwnedIp: {
                  type: "string",
                },
                CustomerOwnedIpv4Pool: {
                  type: "string",
                },
                CarrierIp: {
                  type: "string",
                },
                SubnetId: {
                  type: "string",
                },
                ServiceManaged: {
                  type: "string",
                },
                InstanceId: {
                  type: "string",
                },
                PublicIp: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the Elastic IP addresses.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeAddresses;

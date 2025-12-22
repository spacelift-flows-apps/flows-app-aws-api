import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeSubnetsCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeSubnets: AppBlock = {
  name: "Describe Subnets",
  description: `Describes your subnets.`,
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
        Filters: {
          name: "Filters",
          description: "The filters.",
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
        SubnetIds: {
          name: "Subnet Ids",
          description: "The IDs of the subnets.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const command = new DescribeSubnetsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Subnets Result",
      description: "Result from DescribeSubnets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
          Subnets: {
            type: "array",
            items: {
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
                        type: "object",
                        additionalProperties: true,
                      },
                      Ipv6CidrBlock: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Ipv6CidrBlockState: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Ipv6AddressAttribute: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IpSource: {
                        type: "object",
                        additionalProperties: true,
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
            },
            description: "Information about the subnets.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeSubnets;

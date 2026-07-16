import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeRouteTablesCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeRouteTables: AppBlock = {
  name: "Describe Route Tables",
  description: `Describes your route tables.`,
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
        RouteTableIds: {
          name: "Route Table Ids",
          description: "The IDs of the route tables.",
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

        const command = new DescribeRouteTablesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Route Tables Result",
      description: "Result from DescribeRouteTables operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RouteTables: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Associations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Main: {
                        type: "boolean",
                      },
                      RouteTableAssociationId: {
                        type: "string",
                      },
                      RouteTableId: {
                        type: "string",
                      },
                      SubnetId: {
                        type: "string",
                      },
                      GatewayId: {
                        type: "string",
                      },
                      PublicIpv4Pool: {
                        type: "string",
                      },
                      AssociationState: {
                        type: "object",
                        properties: {
                          State: {},
                          StatusMessage: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                PropagatingVgws: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      GatewayId: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                RouteTableId: {
                  type: "string",
                },
                Routes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      DestinationCidrBlock: {
                        type: "string",
                      },
                      DestinationIpv6CidrBlock: {
                        type: "string",
                      },
                      DestinationPrefixListId: {
                        type: "string",
                      },
                      EgressOnlyInternetGatewayId: {
                        type: "string",
                      },
                      GatewayId: {
                        type: "string",
                      },
                      InstanceId: {
                        type: "string",
                      },
                      InstanceOwnerId: {
                        type: "string",
                      },
                      NatGatewayId: {
                        type: "string",
                      },
                      TransitGatewayId: {
                        type: "string",
                      },
                      LocalGatewayId: {
                        type: "string",
                      },
                      CarrierGatewayId: {
                        type: "string",
                      },
                      NetworkInterfaceId: {
                        type: "string",
                      },
                      Origin: {
                        type: "string",
                      },
                      State: {
                        type: "string",
                      },
                      VpcPeeringConnectionId: {
                        type: "string",
                      },
                      CoreNetworkArn: {
                        type: "string",
                      },
                      OdbNetworkArn: {
                        type: "string",
                      },
                      IpAddress: {
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
                VpcId: {
                  type: "string",
                },
                OwnerId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the route tables.",
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

export default describeRouteTables;

import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateRouteTableCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createRouteTable: AppBlock = {
  name: "Create Route Table",
  description: `Creates a route table for the specified VPC.`,
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
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to assign to the route table.",
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
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
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
        VpcId: {
          name: "Vpc Id",
          description: "The ID of the VPC.",
          type: "string",
          required: true,
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

        const command = new CreateRouteTableCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Route Table Result",
      description: "Result from CreateRouteTable operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RouteTable: {
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
                    AssociationState: {
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
            description: "Information about the route table.",
          },
          ClientToken: {
            type: "string",
            description:
              "Unique, case-sensitive identifier to ensure the idempotency of the request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createRouteTable;

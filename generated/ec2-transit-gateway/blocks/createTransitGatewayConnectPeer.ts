import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  CreateTransitGatewayConnectPeerCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createTransitGatewayConnectPeer: AppBlock = {
  name: "Create Transit Gateway Connect Peer",
  description: `Creates a Connect peer for a specified transit gateway Connect attachment between a transit gateway and an appliance.`,
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
        TransitGatewayAttachmentId: {
          name: "Transit Gateway Attachment Id",
          description: "The ID of the Connect attachment.",
          type: "string",
          required: true,
        },
        TransitGatewayAddress: {
          name: "Transit Gateway Address",
          description:
            "The peer IP address (GRE outer IP address) on the transit gateway side of the Connect peer, which must be specified from a transit gateway CIDR block.",
          type: "string",
          required: false,
        },
        PeerAddress: {
          name: "Peer Address",
          description:
            "The peer IP address (GRE outer IP address) on the appliance side of the Connect peer.",
          type: "string",
          required: true,
        },
        BgpOptions: {
          name: "Bgp Options",
          description: "The BGP options for the Connect peer.",
          type: {
            type: "object",
            properties: {
              PeerAsn: {
                type: "number",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        InsideCidrBlocks: {
          name: "Inside Cidr Blocks",
          description:
            "The range of inside IP addresses that are used for BGP peering.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to apply to the Connect peer.",
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

        const command = new CreateTransitGatewayConnectPeerCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Transit Gateway Connect Peer Result",
      description: "Result from CreateTransitGatewayConnectPeer operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TransitGatewayConnectPeer: {
            type: "object",
            properties: {
              TransitGatewayAttachmentId: {
                type: "string",
              },
              TransitGatewayConnectPeerId: {
                type: "string",
              },
              State: {
                type: "string",
              },
              CreationTime: {
                type: "string",
              },
              ConnectPeerConfiguration: {
                type: "object",
                properties: {
                  TransitGatewayAddress: {
                    type: "string",
                  },
                  PeerAddress: {
                    type: "string",
                  },
                  InsideCidrBlocks: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  Protocol: {
                    type: "string",
                  },
                  BgpConfigurations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        TransitGatewayAsn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        PeerAsn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TransitGatewayAddress: {
                          type: "object",
                          additionalProperties: true,
                        },
                        PeerAddress: {
                          type: "object",
                          additionalProperties: true,
                        },
                        BgpStatus: {
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
            },
            additionalProperties: false,
            description: "Information about the Connect peer.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createTransitGatewayConnectPeer;

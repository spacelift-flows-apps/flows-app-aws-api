import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  CreateVpcPeeringConnectionCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createVpcPeeringConnection: AppBlock = {
  name: "Create Vpc Peering Connection",
  description: `Requests a VPC peering connection between two VPCs: a requester VPC that you own and an accepter VPC with which to create the connection.`,
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
        PeerRegion: {
          name: "Peer Region",
          description:
            "The Region code for the accepter VPC, if the accepter VPC is located in a Region other than the Region in which you make the request.",
          type: "string",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to assign to the peering connection.",
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
        VpcId: {
          name: "Vpc Id",
          description: "The ID of the requester VPC.",
          type: "string",
          required: true,
        },
        PeerVpcId: {
          name: "Peer Vpc Id",
          description:
            "The ID of the VPC with which you are creating the VPC peering connection.",
          type: "string",
          required: false,
        },
        PeerOwnerId: {
          name: "Peer Owner Id",
          description:
            "The Amazon Web Services account ID of the owner of the accepter VPC.",
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

        const command = new CreateVpcPeeringConnectionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Vpc Peering Connection Result",
      description: "Result from CreateVpcPeeringConnection operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          VpcPeeringConnection: {
            type: "object",
            properties: {
              AccepterVpcInfo: {
                type: "object",
                properties: {
                  CidrBlock: {
                    type: "string",
                  },
                  Ipv6CidrBlockSet: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Ipv6CidrBlock: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  CidrBlockSet: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        CidrBlock: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  OwnerId: {
                    type: "string",
                  },
                  PeeringOptions: {
                    type: "object",
                    properties: {
                      AllowDnsResolutionFromRemoteVpc: {
                        type: "boolean",
                      },
                      AllowEgressFromLocalClassicLinkToRemoteVpc: {
                        type: "boolean",
                      },
                      AllowEgressFromLocalVpcToRemoteClassicLink: {
                        type: "boolean",
                      },
                    },
                    additionalProperties: false,
                  },
                  VpcId: {
                    type: "string",
                  },
                  Region: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              ExpirationTime: {
                type: "string",
              },
              RequesterVpcInfo: {
                type: "object",
                properties: {
                  CidrBlock: {
                    type: "string",
                  },
                  Ipv6CidrBlockSet: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Ipv6CidrBlock: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  CidrBlockSet: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        CidrBlock: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  OwnerId: {
                    type: "string",
                  },
                  PeeringOptions: {
                    type: "object",
                    properties: {
                      AllowDnsResolutionFromRemoteVpc: {
                        type: "boolean",
                      },
                      AllowEgressFromLocalClassicLinkToRemoteVpc: {
                        type: "boolean",
                      },
                      AllowEgressFromLocalVpcToRemoteClassicLink: {
                        type: "boolean",
                      },
                    },
                    additionalProperties: false,
                  },
                  VpcId: {
                    type: "string",
                  },
                  Region: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              Status: {
                type: "object",
                properties: {
                  Code: {
                    type: "string",
                  },
                  Message: {
                    type: "string",
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
              VpcPeeringConnectionId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the VPC peering connection.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createVpcPeeringConnection;

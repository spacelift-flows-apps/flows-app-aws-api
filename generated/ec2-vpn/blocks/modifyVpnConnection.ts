import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, ModifyVpnConnectionCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyVpnConnection: AppBlock = {
  name: "Modify Vpn Connection",
  description: `Modifies the customer gateway or the target gateway of an Amazon Web Services Site-to-Site VPN connection.`,
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
        VpnConnectionId: {
          name: "Vpn Connection Id",
          description: "The ID of the VPN connection.",
          type: "string",
          required: true,
        },
        TransitGatewayId: {
          name: "Transit Gateway Id",
          description: "The ID of the transit gateway.",
          type: "string",
          required: false,
        },
        CustomerGatewayId: {
          name: "Customer Gateway Id",
          description:
            "The ID of the customer gateway at your end of the VPN connection.",
          type: "string",
          required: false,
        },
        VpnGatewayId: {
          name: "Vpn Gateway Id",
          description:
            "The ID of the virtual private gateway at the Amazon Web Services side of the VPN connection.",
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

        const command = new ModifyVpnConnectionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Vpn Connection Result",
      description: "Result from ModifyVpnConnection operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          VpnConnection: {
            type: "object",
            properties: {
              Category: {
                type: "string",
              },
              TransitGatewayId: {
                type: "string",
              },
              VpnConcentratorId: {
                type: "string",
              },
              CoreNetworkArn: {
                type: "string",
              },
              CoreNetworkAttachmentArn: {
                type: "string",
              },
              GatewayAssociationState: {
                type: "string",
                enum: [
                  "associated",
                  "not-associated",
                  "associating",
                  "disassociating",
                ],
              },
              Options: {
                type: "object",
                properties: {
                  EnableAcceleration: {
                    type: "boolean",
                  },
                  StaticRoutesOnly: {
                    type: "boolean",
                  },
                  LocalIpv4NetworkCidr: {
                    type: "string",
                  },
                  RemoteIpv4NetworkCidr: {
                    type: "string",
                  },
                  LocalIpv6NetworkCidr: {
                    type: "string",
                  },
                  RemoteIpv6NetworkCidr: {
                    type: "string",
                  },
                  OutsideIpAddressType: {
                    type: "string",
                  },
                  TransportTransitGatewayAttachmentId: {
                    type: "string",
                  },
                  TunnelInsideIpVersion: {
                    type: "string",
                    enum: ["ipv4", "ipv6"],
                  },
                  TunnelOptions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        OutsideIpAddress: {
                          type: "string",
                        },
                        TunnelInsideCidr: {
                          type: "string",
                        },
                        TunnelInsideIpv6Cidr: {
                          type: "string",
                        },
                        PreSharedKey: {
                          type: "string",
                        },
                        Phase1LifetimeSeconds: {
                          type: "number",
                        },
                        Phase2LifetimeSeconds: {
                          type: "number",
                        },
                        RekeyMarginTimeSeconds: {
                          type: "number",
                        },
                        RekeyFuzzPercentage: {
                          type: "number",
                        },
                        ReplayWindowSize: {
                          type: "number",
                        },
                        DpdTimeoutSeconds: {
                          type: "number",
                        },
                        DpdTimeoutAction: {
                          type: "string",
                        },
                        Phase1EncryptionAlgorithms: {
                          type: "array",
                          items: {},
                        },
                        Phase2EncryptionAlgorithms: {
                          type: "array",
                          items: {},
                        },
                        Phase1IntegrityAlgorithms: {
                          type: "array",
                          items: {},
                        },
                        Phase2IntegrityAlgorithms: {
                          type: "array",
                          items: {},
                        },
                        Phase1DHGroupNumbers: {
                          type: "array",
                          items: {},
                        },
                        Phase2DHGroupNumbers: {
                          type: "array",
                          items: {},
                        },
                        IkeVersions: {
                          type: "array",
                          items: {},
                        },
                        StartupAction: {
                          type: "string",
                        },
                        LogOptions: {
                          type: "object",
                          properties: {
                            CloudWatchLogOptions: {},
                          },
                          additionalProperties: false,
                        },
                        EnableTunnelLifecycleControl: {
                          type: "boolean",
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  TunnelBandwidth: {
                    type: "string",
                    enum: ["standard", "large"],
                  },
                },
                additionalProperties: false,
              },
              Routes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DestinationCidrBlock: {
                      type: "string",
                    },
                    Source: {
                      type: "string",
                      enum: ["Static"],
                    },
                    State: {
                      type: "string",
                      enum: ["pending", "available", "deleting", "deleted"],
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
              VgwTelemetry: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AcceptedRouteCount: {
                      type: "number",
                    },
                    LastStatusChange: {
                      type: "string",
                    },
                    OutsideIpAddress: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                      enum: ["UP", "DOWN"],
                    },
                    StatusMessage: {
                      type: "string",
                    },
                    CertificateArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              PreSharedKeyArn: {
                type: "string",
              },
              VpnConnectionId: {
                type: "string",
              },
              State: {
                type: "string",
                enum: ["pending", "available", "deleting", "deleted"],
              },
              CustomerGatewayConfiguration: {
                type: "string",
              },
              Type: {
                type: "string",
                enum: ["ipsec.1"],
              },
              CustomerGatewayId: {
                type: "string",
              },
              VpnGatewayId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the VPN connection.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyVpnConnection;

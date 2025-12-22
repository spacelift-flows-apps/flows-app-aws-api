import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateVpnConnectionCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createVpnConnection: AppBlock = {
  name: "Create Vpn Connection",
  description: `Creates a VPN connection between an existing virtual private gateway or transit gateway and a customer gateway.`,
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
        CustomerGatewayId: {
          name: "Customer Gateway Id",
          description: "The ID of the customer gateway.",
          type: "string",
          required: true,
        },
        Type: {
          name: "Type",
          description: "The type of VPN connection (ipsec.",
          type: "string",
          required: true,
        },
        VpnGatewayId: {
          name: "Vpn Gateway Id",
          description: "The ID of the virtual private gateway.",
          type: "string",
          required: false,
        },
        TransitGatewayId: {
          name: "Transit Gateway Id",
          description: "The ID of the transit gateway.",
          type: "string",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to apply to the VPN connection.",
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
        PreSharedKeyStorage: {
          name: "Pre Shared Key Storage",
          description:
            "Specifies the storage mode for the pre-shared key (PSK).",
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
        Options: {
          name: "Options",
          description: "The options for the VPN connection.",
          type: {
            type: "object",
            properties: {
              EnableAcceleration: {
                type: "boolean",
              },
              TunnelInsideIpVersion: {
                type: "string",
              },
              TunnelOptions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
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
                    DPDTimeoutSeconds: {
                      type: "number",
                    },
                    DPDTimeoutAction: {
                      type: "string",
                    },
                    Phase1EncryptionAlgorithms: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Phase2EncryptionAlgorithms: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Phase1IntegrityAlgorithms: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Phase2IntegrityAlgorithms: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Phase1DHGroupNumbers: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Phase2DHGroupNumbers: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    IKEVersions: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    StartupAction: {
                      type: "string",
                    },
                    LogOptions: {
                      type: "object",
                      properties: {
                        CloudWatchLogOptions: {
                          type: "object",
                          additionalProperties: true,
                        },
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
              StaticRoutesOnly: {
                type: "boolean",
              },
            },
            additionalProperties: false,
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

        const command = new CreateVpnConnectionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Vpn Connection Result",
      description: "Result from CreateVpnConnection operation",
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
              CoreNetworkArn: {
                type: "string",
              },
              CoreNetworkAttachmentArn: {
                type: "string",
              },
              GatewayAssociationState: {
                type: "string",
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
                  },
                  TunnelOptions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        OutsideIpAddress: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TunnelInsideCidr: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TunnelInsideIpv6Cidr: {
                          type: "object",
                          additionalProperties: true,
                        },
                        PreSharedKey: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Phase1LifetimeSeconds: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Phase2LifetimeSeconds: {
                          type: "object",
                          additionalProperties: true,
                        },
                        RekeyMarginTimeSeconds: {
                          type: "object",
                          additionalProperties: true,
                        },
                        RekeyFuzzPercentage: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ReplayWindowSize: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DpdTimeoutSeconds: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DpdTimeoutAction: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Phase1EncryptionAlgorithms: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Phase2EncryptionAlgorithms: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Phase1IntegrityAlgorithms: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Phase2IntegrityAlgorithms: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Phase1DHGroupNumbers: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Phase2DHGroupNumbers: {
                          type: "object",
                          additionalProperties: true,
                        },
                        IkeVersions: {
                          type: "object",
                          additionalProperties: true,
                        },
                        StartupAction: {
                          type: "object",
                          additionalProperties: true,
                        },
                        LogOptions: {
                          type: "object",
                          additionalProperties: true,
                        },
                        EnableTunnelLifecycleControl: {
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
                    },
                    State: {
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
              },
              CustomerGatewayConfiguration: {
                type: "string",
              },
              Type: {
                type: "string",
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

export default createVpnConnection;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  ModifyVpnTunnelCertificateCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyVpnTunnelCertificate: AppBlock = {
  name: "Modify Vpn Tunnel Certificate",
  description: `Modifies the VPN tunnel endpoint certificate.`,
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
          description:
            "The ID of the Amazon Web Services Site-to-Site VPN connection.",
          type: "string",
          required: true,
        },
        VpnTunnelOutsideIpAddress: {
          name: "Vpn Tunnel Outside Ip Address",
          description: "The external IP address of the VPN tunnel.",
          type: "string",
          required: true,
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

        const command = new ModifyVpnTunnelCertificateCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Vpn Tunnel Certificate Result",
      description: "Result from ModifyVpnTunnelCertificate operation",
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

export default modifyVpnTunnelCertificate;

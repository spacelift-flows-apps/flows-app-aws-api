import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeVpnConnectionsCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeVpnConnections: AppBlock = {
  name: "Describe Vpn Connections",
  description: `Describes one or more of your VPN connections.`,
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
        VpnConnectionIds: {
          name: "Vpn Connection Ids",
          description: "One or more VPN connection IDs.",
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

        const command = new DescribeVpnConnectionsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Vpn Connections Result",
      description: "Result from DescribeVpnConnections operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          VpnConnections: {
            type: "array",
            items: {
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
                          OutsideIpAddress: {},
                          TunnelInsideCidr: {},
                          TunnelInsideIpv6Cidr: {},
                          PreSharedKey: {},
                          Phase1LifetimeSeconds: {},
                          Phase2LifetimeSeconds: {},
                          RekeyMarginTimeSeconds: {},
                          RekeyFuzzPercentage: {},
                          ReplayWindowSize: {},
                          DpdTimeoutSeconds: {},
                          DpdTimeoutAction: {},
                          Phase1EncryptionAlgorithms: {},
                          Phase2EncryptionAlgorithms: {},
                          Phase1IntegrityAlgorithms: {},
                          Phase2IntegrityAlgorithms: {},
                          Phase1DHGroupNumbers: {},
                          Phase2DHGroupNumbers: {},
                          IkeVersions: {},
                          StartupAction: {},
                          LogOptions: {},
                          EnableTunnelLifecycleControl: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    TunnelBandwidth: {
                      type: "string",
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
            },
            description: "Information about one or more VPN connections.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeVpnConnections;

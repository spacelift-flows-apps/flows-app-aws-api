import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateClientVpnEndpointCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createClientVpnEndpoint: AppBlock = {
  name: "Create Client Vpn Endpoint",
  description: `Creates a Client VPN endpoint.`,
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
        ClientCidrBlock: {
          name: "Client Cidr Block",
          description:
            "The IPv4 address range, in CIDR notation, from which to assign client IP addresses.",
          type: "string",
          required: true,
        },
        ServerCertificateArn: {
          name: "Server Certificate Arn",
          description: "The ARN of the server certificate.",
          type: "string",
          required: true,
        },
        AuthenticationOptions: {
          name: "Authentication Options",
          description:
            "Information about the authentication method to be used to authenticate clients.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Type: {
                  type: "string",
                },
                ActiveDirectory: {
                  type: "object",
                  properties: {
                    DirectoryId: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                MutualAuthentication: {
                  type: "object",
                  properties: {
                    ClientRootCertificateChainArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                FederatedAuthentication: {
                  type: "object",
                  properties: {
                    SAMLProviderArn: {
                      type: "string",
                    },
                    SelfServiceSAMLProviderArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
          },
          required: true,
        },
        ConnectionLogOptions: {
          name: "Connection Log Options",
          description:
            "Information about the client connection logging options.",
          type: {
            type: "object",
            properties: {
              Enabled: {
                type: "boolean",
              },
              CloudwatchLogGroup: {
                type: "string",
              },
              CloudwatchLogStream: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: true,
        },
        DnsServers: {
          name: "Dns Servers",
          description:
            "Information about the DNS servers to be used for DNS resolution.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        TransportProtocol: {
          name: "Transport Protocol",
          description: "The transport protocol to be used by the VPN session.",
          type: "string",
          required: false,
        },
        VpnPort: {
          name: "Vpn Port",
          description:
            "The port number to assign to the Client VPN endpoint for TCP and UDP traffic.",
          type: "number",
          required: false,
        },
        Description: {
          name: "Description",
          description: "A brief description of the Client VPN endpoint.",
          type: "string",
          required: false,
        },
        SplitTunnel: {
          name: "Split Tunnel",
          description:
            "Indicates whether split-tunnel is enabled on the Client VPN endpoint.",
          type: "boolean",
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description:
            "The tags to apply to the Client VPN endpoint during creation.",
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
        SecurityGroupIds: {
          name: "Security Group Ids",
          description:
            "The IDs of one or more security groups to apply to the target network.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        VpcId: {
          name: "Vpc Id",
          description:
            "The ID of the VPC to associate with the Client VPN endpoint.",
          type: "string",
          required: false,
        },
        SelfServicePortal: {
          name: "Self Service Portal",
          description:
            "Specify whether to enable the self-service portal for the Client VPN endpoint.",
          type: "string",
          required: false,
        },
        ClientConnectOptions: {
          name: "Client Connect Options",
          description:
            "The options for managing connection authorization for new client connections.",
          type: {
            type: "object",
            properties: {
              Enabled: {
                type: "boolean",
              },
              LambdaFunctionArn: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        SessionTimeoutHours: {
          name: "Session Timeout Hours",
          description: "The maximum VPN session duration time in hours.",
          type: "number",
          required: false,
        },
        ClientLoginBannerOptions: {
          name: "Client Login Banner Options",
          description:
            "Options for enabling a customizable text banner that will be displayed on Amazon Web Services provided clients when a VPN session is established.",
          type: {
            type: "object",
            properties: {
              Enabled: {
                type: "boolean",
              },
              BannerText: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        ClientRouteEnforcementOptions: {
          name: "Client Route Enforcement Options",
          description:
            "Client route enforcement is a feature of the Client VPN service that helps enforce administrator defined routes on devices connected through the VPN.",
          type: {
            type: "object",
            properties: {
              Enforced: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        DisconnectOnSessionTimeout: {
          name: "Disconnect On Session Timeout",
          description:
            "Indicates whether the client VPN session is disconnected after the maximum timeout specified in SessionTimeoutHours is reached.",
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

        const command = new CreateClientVpnEndpointCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Client Vpn Endpoint Result",
      description: "Result from CreateClientVpnEndpoint operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ClientVpnEndpointId: {
            type: "string",
            description: "The ID of the Client VPN endpoint.",
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
            description: "The current state of the Client VPN endpoint.",
          },
          DnsName: {
            type: "string",
            description:
              "The DNS name to be used by clients when establishing their VPN session.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createClientVpnEndpoint;

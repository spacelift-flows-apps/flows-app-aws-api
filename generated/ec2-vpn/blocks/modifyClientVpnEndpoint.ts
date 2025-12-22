import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, ModifyClientVpnEndpointCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyClientVpnEndpoint: AppBlock = {
  name: "Modify Client Vpn Endpoint",
  description: `Modifies the specified Client VPN endpoint.`,
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
        ClientVpnEndpointId: {
          name: "Client Vpn Endpoint Id",
          description: "The ID of the Client VPN endpoint to modify.",
          type: "string",
          required: true,
        },
        ServerCertificateArn: {
          name: "Server Certificate Arn",
          description: "The ARN of the server certificate to be used.",
          type: "string",
          required: false,
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
          required: false,
        },
        DnsServers: {
          name: "Dns Servers",
          description:
            "Information about the DNS servers to be used by Client VPN connections.",
          type: {
            type: "object",
            properties: {
              CustomDnsServers: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              Enabled: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
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
          description: "Indicates whether the VPN is split-tunnel.",
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
            "Indicates whether the client VPN session is disconnected after the maximum timeout specified in sessionTimeoutHours is reached.",
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

        const command = new ModifyClientVpnEndpointCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Client Vpn Endpoint Result",
      description: "Result from ModifyClientVpnEndpoint operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Return: {
            type: "boolean",
            description:
              "Returns true if the request succeeds; otherwise, it returns an error.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyClientVpnEndpoint;

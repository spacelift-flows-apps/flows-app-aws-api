import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  GetActiveVpnTunnelStatusCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getActiveVpnTunnelStatus: AppBlock = {
  name: "Get Active Vpn Tunnel Status",
  description: `Returns the currently negotiated security parameters for an active VPN tunnel, including IKE version, DH groups, encryption algorithms, and integrity algorithms.`,
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
            "The ID of the VPN connection for which to retrieve the active tunnel status.",
          type: "string",
          required: true,
        },
        VpnTunnelOutsideIpAddress: {
          name: "Vpn Tunnel Outside Ip Address",
          description:
            "The external IP address of the VPN tunnel for which to retrieve the active status.",
          type: "string",
          required: true,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request.",
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

        const command = new GetActiveVpnTunnelStatusCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Active Vpn Tunnel Status Result",
      description: "Result from GetActiveVpnTunnelStatus operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ActiveVpnTunnelStatus: {
            type: "object",
            properties: {
              Phase1EncryptionAlgorithm: {
                type: "string",
              },
              Phase2EncryptionAlgorithm: {
                type: "string",
              },
              Phase1IntegrityAlgorithm: {
                type: "string",
              },
              Phase2IntegrityAlgorithm: {
                type: "string",
              },
              Phase1DHGroup: {
                type: "number",
              },
              Phase2DHGroup: {
                type: "number",
              },
              IkeVersion: {
                type: "string",
              },
              ProvisioningStatus: {
                type: "string",
              },
              ProvisioningStatusReason: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Information about the current security configuration of the VPN tunnel.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getActiveVpnTunnelStatus;

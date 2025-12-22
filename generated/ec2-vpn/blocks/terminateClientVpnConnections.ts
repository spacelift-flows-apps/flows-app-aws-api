import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  TerminateClientVpnConnectionsCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const terminateClientVpnConnections: AppBlock = {
  name: "Terminate Client Vpn Connections",
  description: `Terminates active Client VPN endpoint connections.`,
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
          description:
            "The ID of the Client VPN endpoint to which the client is connected.",
          type: "string",
          required: true,
        },
        ConnectionId: {
          name: "Connection Id",
          description: "The ID of the client connection to be terminated.",
          type: "string",
          required: false,
        },
        Username: {
          name: "Username",
          description: "The name of the user who initiated the connection.",
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

        const command = new TerminateClientVpnConnectionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Terminate Client Vpn Connections Result",
      description: "Result from TerminateClientVpnConnections operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ClientVpnEndpointId: {
            type: "string",
            description: "The ID of the Client VPN endpoint.",
          },
          Username: {
            type: "string",
            description:
              "The user who established the terminated client connections.",
          },
          ConnectionStatuses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ConnectionId: {
                  type: "string",
                },
                PreviousStatus: {
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
                CurrentStatus: {
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
              },
              additionalProperties: false,
            },
            description: "The current state of the client connections.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default terminateClientVpnConnections;

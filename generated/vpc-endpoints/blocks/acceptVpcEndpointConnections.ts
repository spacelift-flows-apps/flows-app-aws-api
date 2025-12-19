import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  AcceptVpcEndpointConnectionsCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const acceptVpcEndpointConnections: AppBlock = {
  name: "Accept Vpc Endpoint Connections",
  description: `Accepts connection requests to your VPC endpoint service.`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        ServiceId: {
          name: "Service Id",
          description: "The ID of the VPC endpoint service.",
          type: "string",
          required: true,
        },
        VpcEndpointIds: {
          name: "Vpc Endpoint Ids",
          description: "The IDs of the interface VPC endpoints.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new AcceptVpcEndpointConnectionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Accept Vpc Endpoint Connections Result",
      description: "Result from AcceptVpcEndpointConnections operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Unsuccessful: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Error: {
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
                ResourceId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the interface endpoints that were not accepted, if applicable.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default acceptVpcEndpointConnections;

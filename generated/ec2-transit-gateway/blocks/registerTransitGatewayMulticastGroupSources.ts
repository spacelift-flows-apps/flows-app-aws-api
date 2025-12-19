import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  RegisterTransitGatewayMulticastGroupSourcesCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const registerTransitGatewayMulticastGroupSources: AppBlock = {
  name: "Register Transit Gateway Multicast Group Sources",
  description: `Registers sources (network interfaces) with the specified transit gateway multicast group.`,
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
        TransitGatewayMulticastDomainId: {
          name: "Transit Gateway Multicast Domain Id",
          description: "The ID of the transit gateway multicast domain.",
          type: "string",
          required: true,
        },
        GroupIpAddress: {
          name: "Group Ip Address",
          description:
            "The IP address assigned to the transit gateway multicast group.",
          type: "string",
          required: false,
        },
        NetworkInterfaceIds: {
          name: "Network Interface Ids",
          description:
            "The group sources' network interface IDs to register with the transit gateway multicast group.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const command = new RegisterTransitGatewayMulticastGroupSourcesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Register Transit Gateway Multicast Group Sources Result",
      description:
        "Result from RegisterTransitGatewayMulticastGroupSources operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RegisteredMulticastGroupSources: {
            type: "object",
            properties: {
              TransitGatewayMulticastDomainId: {
                type: "string",
              },
              RegisteredNetworkInterfaceIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              GroupIpAddress: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Information about the transit gateway multicast group sources.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default registerTransitGatewayMulticastGroupSources;

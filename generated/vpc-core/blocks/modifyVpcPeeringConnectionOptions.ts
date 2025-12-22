import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  ModifyVpcPeeringConnectionOptionsCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyVpcPeeringConnectionOptions: AppBlock = {
  name: "Modify Vpc Peering Connection Options",
  description: `Modifies the VPC peering connection options on one side of a VPC peering connection.`,
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
        AccepterPeeringConnectionOptions: {
          name: "Accepter Peering Connection Options",
          description:
            "The VPC peering connection options for the accepter VPC.",
          type: {
            type: "object",
            properties: {
              AllowDnsResolutionFromRemoteVpc: {
                type: "boolean",
              },
              AllowEgressFromLocalClassicLinkToRemoteVpc: {
                type: "boolean",
              },
              AllowEgressFromLocalVpcToRemoteClassicLink: {
                type: "boolean",
              },
            },
            additionalProperties: false,
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
        RequesterPeeringConnectionOptions: {
          name: "Requester Peering Connection Options",
          description:
            "The VPC peering connection options for the requester VPC.",
          type: {
            type: "object",
            properties: {
              AllowDnsResolutionFromRemoteVpc: {
                type: "boolean",
              },
              AllowEgressFromLocalClassicLinkToRemoteVpc: {
                type: "boolean",
              },
              AllowEgressFromLocalVpcToRemoteClassicLink: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        VpcPeeringConnectionId: {
          name: "Vpc Peering Connection Id",
          description: "The ID of the VPC peering connection.",
          type: "string",
          required: true,
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

        const command = new ModifyVpcPeeringConnectionOptionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Vpc Peering Connection Options Result",
      description: "Result from ModifyVpcPeeringConnectionOptions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AccepterPeeringConnectionOptions: {
            type: "object",
            properties: {
              AllowDnsResolutionFromRemoteVpc: {
                type: "boolean",
              },
              AllowEgressFromLocalClassicLinkToRemoteVpc: {
                type: "boolean",
              },
              AllowEgressFromLocalVpcToRemoteClassicLink: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description:
              "Information about the VPC peering connection options for the accepter VPC.",
          },
          RequesterPeeringConnectionOptions: {
            type: "object",
            properties: {
              AllowDnsResolutionFromRemoteVpc: {
                type: "boolean",
              },
              AllowEgressFromLocalClassicLinkToRemoteVpc: {
                type: "boolean",
              },
              AllowEgressFromLocalVpcToRemoteClassicLink: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description:
              "Information about the VPC peering connection options for the requester VPC.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyVpcPeeringConnectionOptions;

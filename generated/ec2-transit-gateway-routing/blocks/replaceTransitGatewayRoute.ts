import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  ReplaceTransitGatewayRouteCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const replaceTransitGatewayRoute: AppBlock = {
  name: "Replace Transit Gateway Route",
  description: `Replaces the specified route in the specified transit gateway route table.`,
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
        DestinationCidrBlock: {
          name: "Destination Cidr Block",
          description: "The CIDR range used for the destination match.",
          type: "string",
          required: true,
        },
        TransitGatewayRouteTableId: {
          name: "Transit Gateway Route Table Id",
          description: "The ID of the route table.",
          type: "string",
          required: true,
        },
        TransitGatewayAttachmentId: {
          name: "Transit Gateway Attachment Id",
          description: "The ID of the attachment.",
          type: "string",
          required: false,
        },
        Blackhole: {
          name: "Blackhole",
          description:
            "Indicates whether traffic matching this route is to be dropped.",
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

        const command = new ReplaceTransitGatewayRouteCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Replace Transit Gateway Route Result",
      description: "Result from ReplaceTransitGatewayRoute operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Route: {
            type: "object",
            properties: {
              DestinationCidrBlock: {
                type: "string",
              },
              PrefixListId: {
                type: "string",
              },
              TransitGatewayRouteTableAnnouncementId: {
                type: "string",
              },
              TransitGatewayAttachments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ResourceId: {
                      type: "string",
                    },
                    TransitGatewayAttachmentId: {
                      type: "string",
                    },
                    ResourceType: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              Type: {
                type: "string",
              },
              State: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the modified route.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default replaceTransitGatewayRoute;

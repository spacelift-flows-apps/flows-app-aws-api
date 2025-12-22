import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  SearchTransitGatewayRoutesCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const searchTransitGatewayRoutes: AppBlock = {
  name: "Search Transit Gateway Routes",
  description: `Searches for routes in the specified transit gateway route table.`,
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
        TransitGatewayRouteTableId: {
          name: "Transit Gateway Route Table Id",
          description: "The ID of the transit gateway route table.",
          type: "string",
          required: true,
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
          required: true,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of routes to return.",
          type: "number",
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

        const command = new SearchTransitGatewayRoutesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Search Transit Gateway Routes Result",
      description: "Result from SearchTransitGatewayRoutes operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Routes: {
            type: "array",
            items: {
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
                        type: "object",
                        additionalProperties: true,
                      },
                      TransitGatewayAttachmentId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ResourceType: {
                        type: "object",
                        additionalProperties: true,
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
            },
            description: "Information about the routes.",
          },
          AdditionalRoutesAvailable: {
            type: "boolean",
            description:
              "Indicates whether there are additional routes available.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default searchTransitGatewayRoutes;

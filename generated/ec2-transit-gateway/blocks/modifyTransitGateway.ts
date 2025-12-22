import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, ModifyTransitGatewayCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyTransitGateway: AppBlock = {
  name: "Modify Transit Gateway",
  description: `Modifies the specified transit gateway.`,
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
        TransitGatewayId: {
          name: "Transit Gateway Id",
          description: "The ID of the transit gateway.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "The description for the transit gateway.",
          type: "string",
          required: false,
        },
        Options: {
          name: "Options",
          description: "The options to modify.",
          type: {
            type: "object",
            properties: {
              AddTransitGatewayCidrBlocks: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              RemoveTransitGatewayCidrBlocks: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              VpnEcmpSupport: {
                type: "string",
              },
              DnsSupport: {
                type: "string",
              },
              SecurityGroupReferencingSupport: {
                type: "string",
              },
              AutoAcceptSharedAttachments: {
                type: "string",
              },
              DefaultRouteTableAssociation: {
                type: "string",
              },
              AssociationDefaultRouteTableId: {
                type: "string",
              },
              DefaultRouteTablePropagation: {
                type: "string",
              },
              PropagationDefaultRouteTableId: {
                type: "string",
              },
              AmazonSideAsn: {
                type: "number",
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

        const command = new ModifyTransitGatewayCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Transit Gateway Result",
      description: "Result from ModifyTransitGateway operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TransitGateway: {
            type: "object",
            properties: {
              TransitGatewayId: {
                type: "string",
              },
              TransitGatewayArn: {
                type: "string",
              },
              State: {
                type: "string",
              },
              OwnerId: {
                type: "string",
              },
              Description: {
                type: "string",
              },
              CreationTime: {
                type: "string",
              },
              Options: {
                type: "object",
                properties: {
                  AmazonSideAsn: {
                    type: "number",
                  },
                  TransitGatewayCidrBlocks: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  AutoAcceptSharedAttachments: {
                    type: "string",
                  },
                  DefaultRouteTableAssociation: {
                    type: "string",
                  },
                  AssociationDefaultRouteTableId: {
                    type: "string",
                  },
                  DefaultRouteTablePropagation: {
                    type: "string",
                  },
                  PropagationDefaultRouteTableId: {
                    type: "string",
                  },
                  VpnEcmpSupport: {
                    type: "string",
                  },
                  DnsSupport: {
                    type: "string",
                  },
                  SecurityGroupReferencingSupport: {
                    type: "string",
                  },
                  MulticastSupport: {
                    type: "string",
                  },
                },
                additionalProperties: false,
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
            },
            additionalProperties: false,
            description: "Information about the transit gateway.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyTransitGateway;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  ModifyTransitGatewayVpcAttachmentCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyTransitGatewayVpcAttachment: AppBlock = {
  name: "Modify Transit Gateway Vpc Attachment",
  description: `Modifies the specified VPC attachment.`,
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
        TransitGatewayAttachmentId: {
          name: "Transit Gateway Attachment Id",
          description: "The ID of the attachment.",
          type: "string",
          required: true,
        },
        AddSubnetIds: {
          name: "Add Subnet Ids",
          description: "The IDs of one or more subnets to add.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        RemoveSubnetIds: {
          name: "Remove Subnet Ids",
          description: "The IDs of one or more subnets to remove.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Options: {
          name: "Options",
          description: "The new VPC attachment options.",
          type: {
            type: "object",
            properties: {
              DnsSupport: {
                type: "string",
              },
              SecurityGroupReferencingSupport: {
                type: "string",
              },
              Ipv6Support: {
                type: "string",
              },
              ApplianceModeSupport: {
                type: "string",
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

        const command = new ModifyTransitGatewayVpcAttachmentCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Transit Gateway Vpc Attachment Result",
      description: "Result from ModifyTransitGatewayVpcAttachment operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TransitGatewayVpcAttachment: {
            type: "object",
            properties: {
              TransitGatewayAttachmentId: {
                type: "string",
              },
              TransitGatewayId: {
                type: "string",
              },
              VpcId: {
                type: "string",
              },
              VpcOwnerId: {
                type: "string",
              },
              State: {
                type: "string",
              },
              SubnetIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              CreationTime: {
                type: "string",
              },
              Options: {
                type: "object",
                properties: {
                  DnsSupport: {
                    type: "string",
                  },
                  SecurityGroupReferencingSupport: {
                    type: "string",
                  },
                  Ipv6Support: {
                    type: "string",
                  },
                  ApplianceModeSupport: {
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
            description: "Information about the modified attachment.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyTransitGatewayVpcAttachment;

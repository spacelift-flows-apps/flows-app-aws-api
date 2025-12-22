import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeNetworkInterfaceAttributeCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeNetworkInterfaceAttribute: AppBlock = {
  name: "Describe Network Interface Attribute",
  description: `Describes a network interface attribute.`,
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
        NetworkInterfaceId: {
          name: "Network Interface Id",
          description: "The ID of the network interface.",
          type: "string",
          required: true,
        },
        Attribute: {
          name: "Attribute",
          description: "The attribute of the network interface.",
          type: "string",
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

        const command = new DescribeNetworkInterfaceAttributeCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Network Interface Attribute Result",
      description: "Result from DescribeNetworkInterfaceAttribute operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Attachment: {
            type: "object",
            properties: {
              AttachTime: {
                type: "string",
              },
              AttachmentId: {
                type: "string",
              },
              DeleteOnTermination: {
                type: "boolean",
              },
              DeviceIndex: {
                type: "number",
              },
              NetworkCardIndex: {
                type: "number",
              },
              InstanceId: {
                type: "string",
              },
              InstanceOwnerId: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              EnaSrdSpecification: {
                type: "object",
                properties: {
                  EnaSrdEnabled: {
                    type: "boolean",
                  },
                  EnaSrdUdpSpecification: {
                    type: "object",
                    properties: {
                      EnaSrdUdpEnabled: {
                        type: "boolean",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              EnaQueueCount: {
                type: "number",
              },
            },
            additionalProperties: false,
            description: "The attachment (if any) of the network interface.",
          },
          Description: {
            type: "object",
            properties: {
              Value: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The description of the network interface.",
          },
          Groups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                GroupId: {
                  type: "string",
                },
                GroupName: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "The security groups associated with the network interface.",
          },
          NetworkInterfaceId: {
            type: "string",
            description: "The ID of the network interface.",
          },
          SourceDestCheck: {
            type: "object",
            properties: {
              Value: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description:
              "Indicates whether source/destination checking is enabled.",
          },
          AssociatePublicIpAddress: {
            type: "boolean",
            description:
              "Indicates whether to assign a public IPv4 address to a network interface.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeNetworkInterfaceAttribute;

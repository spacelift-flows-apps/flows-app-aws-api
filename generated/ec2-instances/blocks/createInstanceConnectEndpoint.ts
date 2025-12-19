import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  CreateInstanceConnectEndpointCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createInstanceConnectEndpoint: AppBlock = {
  name: "Create Instance Connect Endpoint",
  description: `Creates an EC2 Instance Connect Endpoint.`,
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
        SubnetId: {
          name: "Subnet Id",
          description:
            "The ID of the subnet in which to create the EC2 Instance Connect Endpoint.",
          type: "string",
          required: true,
        },
        SecurityGroupIds: {
          name: "Security Group Ids",
          description:
            "One or more security groups to associate with the endpoint.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        PreserveClientIp: {
          name: "Preserve Client Ip",
          description:
            "Indicates whether the client IP address is preserved as the source.",
          type: "boolean",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description:
            "The tags to apply to the EC2 Instance Connect Endpoint during creation.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ResourceType: {
                  type: "string",
                },
                Tags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        IpAddressType: {
          name: "Ip Address Type",
          description: "The IP address type of the endpoint.",
          type: "string",
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

        const command = new CreateInstanceConnectEndpointCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Instance Connect Endpoint Result",
      description: "Result from CreateInstanceConnectEndpoint operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceConnectEndpoint: {
            type: "object",
            properties: {
              OwnerId: {
                type: "string",
              },
              InstanceConnectEndpointId: {
                type: "string",
              },
              InstanceConnectEndpointArn: {
                type: "string",
              },
              State: {
                type: "string",
              },
              StateMessage: {
                type: "string",
              },
              DnsName: {
                type: "string",
              },
              FipsDnsName: {
                type: "string",
              },
              NetworkInterfaceIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              VpcId: {
                type: "string",
              },
              AvailabilityZone: {
                type: "string",
              },
              CreatedAt: {
                type: "string",
              },
              SubnetId: {
                type: "string",
              },
              PreserveClientIp: {
                type: "boolean",
              },
              SecurityGroupIds: {
                type: "array",
                items: {
                  type: "string",
                },
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
              IpAddressType: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the EC2 Instance Connect Endpoint.",
          },
          ClientToken: {
            type: "string",
            description:
              "Unique, case-sensitive idempotency token provided by the client in the the request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createInstanceConnectEndpoint;

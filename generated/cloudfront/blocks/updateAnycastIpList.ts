import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  UpdateAnycastIpListCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateAnycastIpList: AppBlock = {
  name: "Update Anycast Ip List",
  description: `Updates an Anycast static IP list.`,
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
        Id: {
          name: "Id",
          description: "The ID of the Anycast static IP list.",
          type: "string",
          required: true,
        },
        IpAddressType: {
          name: "Ip Address Type",
          description: "The IP address type for the Anycast static IP list.",
          type: "string",
          required: false,
        },
        IpamCidrConfigs: {
          name: "Ipam Cidr Configs",
          description:
            "A list of IPAM CIDR configurations that specify the IP address ranges and IPAM pool settings for updating the Anycast static IP list.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Cidr: {
                  type: "string",
                },
                IpamPoolArn: {
                  type: "string",
                },
                AnycastIp: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
              },
              required: ["Cidr", "IpamPoolArn"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        IfMatch: {
          name: "If Match",
          description:
            "The current version (ETag value) of the Anycast static IP list that you are updating.",
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateAnycastIpListCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Anycast Ip List Result",
      description: "Result from UpdateAnycastIpList operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AnycastIpList: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              Name: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              Arn: {
                type: "string",
              },
              IpAddressType: {
                type: "string",
              },
              IpamConfig: {
                type: "object",
                properties: {
                  Quantity: {
                    type: "number",
                  },
                  IpamCidrConfigs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Cidr: {
                          type: "string",
                        },
                        IpamPoolArn: {
                          type: "string",
                        },
                        AnycastIp: {
                          type: "string",
                        },
                        Status: {
                          type: "string",
                        },
                      },
                      required: ["Cidr", "IpamPoolArn"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["Quantity", "IpamCidrConfigs"],
                additionalProperties: false,
              },
              AnycastIps: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              IpCount: {
                type: "number",
              },
              LastModifiedTime: {
                type: "string",
              },
            },
            required: [
              "Id",
              "Name",
              "Status",
              "Arn",
              "AnycastIps",
              "IpCount",
              "LastModifiedTime",
            ],
            additionalProperties: false,
            description: "An Anycast static IP list.",
          },
          ETag: {
            type: "string",
            description: "The current version of the Anycast static IP list.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateAnycastIpList;

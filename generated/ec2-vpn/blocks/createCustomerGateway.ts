import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateCustomerGatewayCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createCustomerGateway: AppBlock = {
  name: "Create Customer Gateway",
  description: `Provides information to Amazon Web Services about your customer gateway device.`,
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
        BgpAsn: {
          name: "Bgp Asn",
          description:
            "For customer gateway devices that support BGP, specify the device's ASN.",
          type: "number",
          required: false,
        },
        PublicIp: {
          name: "Public Ip",
          description: "This member has been deprecated.",
          type: "string",
          required: false,
        },
        CertificateArn: {
          name: "Certificate Arn",
          description:
            "The Amazon Resource Name (ARN) for the customer gateway certificate.",
          type: "string",
          required: false,
        },
        Type: {
          name: "Type",
          description:
            "The type of VPN connection that this customer gateway supports (ipsec.",
          type: "string",
          required: true,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to apply to the customer gateway.",
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
        DeviceName: {
          name: "Device Name",
          description: "A name for the customer gateway device.",
          type: "string",
          required: false,
        },
        IpAddress: {
          name: "Ip Address",
          description:
            "The IP address for the customer gateway device's outside interface.",
          type: "string",
          required: false,
        },
        BgpAsnExtended: {
          name: "Bgp Asn Extended",
          description:
            "For customer gateway devices that support BGP, specify the device's ASN.",
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

        const command = new CreateCustomerGatewayCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Customer Gateway Result",
      description: "Result from CreateCustomerGateway operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CustomerGateway: {
            type: "object",
            properties: {
              CertificateArn: {
                type: "string",
              },
              DeviceName: {
                type: "string",
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
              BgpAsnExtended: {
                type: "string",
              },
              CustomerGatewayId: {
                type: "string",
              },
              State: {
                type: "string",
              },
              Type: {
                type: "string",
              },
              IpAddress: {
                type: "string",
              },
              BgpAsn: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the customer gateway.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createCustomerGateway;

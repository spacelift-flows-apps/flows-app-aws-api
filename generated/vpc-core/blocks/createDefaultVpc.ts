import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateDefaultVpcCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createDefaultVpc: AppBlock = {
  name: "Create Default Vpc",
  description: `Creates a default VPC with a size /16 IPv4 CIDR block and a default subnet in each Availability Zone.`,
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

        const command = new CreateDefaultVpcCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Default Vpc Result",
      description: "Result from CreateDefaultVpc operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Vpc: {
            type: "object",
            properties: {
              OwnerId: {
                type: "string",
              },
              InstanceTenancy: {
                type: "string",
              },
              Ipv6CidrBlockAssociationSet: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AssociationId: {
                      type: "string",
                    },
                    Ipv6CidrBlock: {
                      type: "string",
                    },
                    Ipv6CidrBlockState: {
                      type: "object",
                      properties: {
                        State: {
                          type: "object",
                          additionalProperties: true,
                        },
                        StatusMessage: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    NetworkBorderGroup: {
                      type: "string",
                    },
                    Ipv6Pool: {
                      type: "string",
                    },
                    Ipv6AddressAttribute: {
                      type: "string",
                    },
                    IpSource: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              CidrBlockAssociationSet: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AssociationId: {
                      type: "string",
                    },
                    CidrBlock: {
                      type: "string",
                    },
                    CidrBlockState: {
                      type: "object",
                      properties: {
                        State: {
                          type: "object",
                          additionalProperties: true,
                        },
                        StatusMessage: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              IsDefault: {
                type: "boolean",
              },
              EncryptionControl: {
                type: "object",
                properties: {
                  VpcId: {
                    type: "string",
                  },
                  VpcEncryptionControlId: {
                    type: "string",
                  },
                  Mode: {
                    type: "string",
                  },
                  State: {
                    type: "string",
                  },
                  StateMessage: {
                    type: "string",
                  },
                  ResourceExclusions: {
                    type: "object",
                    properties: {
                      InternetGateway: {
                        type: "object",
                        properties: {
                          State: {
                            type: "object",
                            additionalProperties: true,
                          },
                          StateMessage: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      EgressOnlyInternetGateway: {
                        type: "object",
                        properties: {
                          State: {
                            type: "object",
                            additionalProperties: true,
                          },
                          StateMessage: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      NatGateway: {
                        type: "object",
                        properties: {
                          State: {
                            type: "object",
                            additionalProperties: true,
                          },
                          StateMessage: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      VirtualPrivateGateway: {
                        type: "object",
                        properties: {
                          State: {
                            type: "object",
                            additionalProperties: true,
                          },
                          StateMessage: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
                      },
                      VpcPeering: {
                        type: "object",
                        properties: {
                          State: {
                            type: "object",
                            additionalProperties: true,
                          },
                          StateMessage: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        additionalProperties: false,
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
              BlockPublicAccessStates: {
                type: "object",
                properties: {
                  InternetGatewayBlockMode: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              VpcId: {
                type: "string",
              },
              State: {
                type: "string",
              },
              CidrBlock: {
                type: "string",
              },
              DhcpOptionsId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the VPC.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createDefaultVpc;

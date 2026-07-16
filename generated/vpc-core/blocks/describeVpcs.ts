import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeVpcsCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeVpcs: AppBlock = {
  name: "Describe Vpcs",
  description: `Describes your VPCs.`,
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
        Filters: {
          name: "Filters",
          description: "The filters.",
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
          required: false,
        },
        VpcIds: {
          name: "Vpc Ids",
          description: "The IDs of the VPCs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token returned from a previous paginated request.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of items to return for this request.",
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

        const command = new DescribeVpcsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Vpcs Result",
      description: "Result from DescribeVpcs operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
          Vpcs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                OwnerId: {
                  type: "string",
                },
                InstanceTenancy: {
                  type: "string",
                  enum: ["default", "dedicated", "host"],
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
                          State: {},
                          StatusMessage: {},
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
                        enum: ["public", "private"],
                      },
                      IpSource: {
                        type: "string",
                        enum: ["amazon", "byoip", "none"],
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
                          State: {},
                          StatusMessage: {},
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
                      enum: ["monitor", "enforce"],
                    },
                    State: {
                      type: "string",
                      enum: [
                        "enforce-in-progress",
                        "monitor-in-progress",
                        "enforce-failed",
                        "monitor-failed",
                        "deleting",
                        "deleted",
                        "available",
                        "creating",
                        "delete-failed",
                      ],
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
                            State: {},
                            StateMessage: {},
                          },
                          additionalProperties: false,
                        },
                        EgressOnlyInternetGateway: {
                          type: "object",
                          properties: {
                            State: {},
                            StateMessage: {},
                          },
                          additionalProperties: false,
                        },
                        NatGateway: {
                          type: "object",
                          properties: {
                            State: {},
                            StateMessage: {},
                          },
                          additionalProperties: false,
                        },
                        VirtualPrivateGateway: {
                          type: "object",
                          properties: {
                            State: {},
                            StateMessage: {},
                          },
                          additionalProperties: false,
                        },
                        VpcPeering: {
                          type: "object",
                          properties: {
                            State: {},
                            StateMessage: {},
                          },
                          additionalProperties: false,
                        },
                        Lambda: {
                          type: "object",
                          properties: {
                            State: {},
                            StateMessage: {},
                          },
                          additionalProperties: false,
                        },
                        VpcLattice: {
                          type: "object",
                          properties: {
                            State: {},
                            StateMessage: {},
                          },
                          additionalProperties: false,
                        },
                        ElasticFileSystem: {
                          type: "object",
                          properties: {
                            State: {},
                            StateMessage: {},
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
                          Key: {},
                          Value: {},
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
                      enum: ["off", "block-bidirectional", "block-ingress"],
                    },
                  },
                  additionalProperties: false,
                },
                VpcId: {
                  type: "string",
                },
                State: {
                  type: "string",
                  enum: ["pending", "available"],
                },
                CidrBlock: {
                  type: "string",
                },
                DhcpOptionsId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the VPCs.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeVpcs;

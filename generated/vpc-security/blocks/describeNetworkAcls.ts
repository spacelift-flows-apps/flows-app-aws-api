import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeNetworkAclsCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeNetworkAcls: AppBlock = {
  name: "Describe Network Acls",
  description: `Describes your network ACLs.`,
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
        NetworkAclIds: {
          name: "Network Acl Ids",
          description: "The IDs of the network ACLs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const command = new DescribeNetworkAclsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Network Acls Result",
      description: "Result from DescribeNetworkAcls operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NetworkAcls: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Associations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      NetworkAclAssociationId: {
                        type: "string",
                      },
                      NetworkAclId: {
                        type: "string",
                      },
                      SubnetId: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                Entries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      CidrBlock: {
                        type: "string",
                      },
                      Egress: {
                        type: "boolean",
                      },
                      IcmpTypeCode: {
                        type: "object",
                        properties: {
                          Code: {},
                          Type: {},
                        },
                        additionalProperties: false,
                      },
                      Ipv6CidrBlock: {
                        type: "string",
                      },
                      PortRange: {
                        type: "object",
                        properties: {
                          From: {},
                          To: {},
                        },
                        additionalProperties: false,
                      },
                      Protocol: {
                        type: "string",
                      },
                      RuleAction: {
                        type: "string",
                        enum: ["allow", "deny"],
                      },
                      RuleNumber: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                IsDefault: {
                  type: "boolean",
                },
                NetworkAclId: {
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
                VpcId: {
                  type: "string",
                },
                OwnerId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the network ACLs.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeNetworkAcls;

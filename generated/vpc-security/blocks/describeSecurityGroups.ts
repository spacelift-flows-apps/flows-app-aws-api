import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeSecurityGroups: AppBlock = {
  name: "Describe Security Groups",
  description: `Describes the specified security groups or all of your security groups.`,
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
        GroupIds: {
          name: "Group Ids",
          description: "The IDs of the security groups.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        GroupNames: {
          name: "Group Names",
          description: "[Default VPC] The names of the security groups.",
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

        const command = new DescribeSecurityGroupsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Security Groups Result",
      description: "Result from DescribeSecurityGroups operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
          SecurityGroups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                GroupId: {
                  type: "string",
                },
                IpPermissionsEgress: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      IpProtocol: {
                        type: "object",
                        additionalProperties: true,
                      },
                      FromPort: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ToPort: {
                        type: "object",
                        additionalProperties: true,
                      },
                      UserIdGroupPairs: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IpRanges: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Ipv6Ranges: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PrefixListIds: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
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
                VpcId: {
                  type: "string",
                },
                SecurityGroupArn: {
                  type: "string",
                },
                OwnerId: {
                  type: "string",
                },
                GroupName: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                IpPermissions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      IpProtocol: {
                        type: "object",
                        additionalProperties: true,
                      },
                      FromPort: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ToPort: {
                        type: "object",
                        additionalProperties: true,
                      },
                      UserIdGroupPairs: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IpRanges: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Ipv6Ranges: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PrefixListIds: {
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
            description: "Information about the security groups.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeSecurityGroups;

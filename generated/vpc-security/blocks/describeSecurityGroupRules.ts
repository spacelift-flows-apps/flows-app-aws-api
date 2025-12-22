import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeSecurityGroupRulesCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeSecurityGroupRules: AppBlock = {
  name: "Describe Security Group Rules",
  description: `Describes one or more of your security group rules.`,
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
          description: "One or more filters.",
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
        SecurityGroupRuleIds: {
          name: "Security Group Rule Ids",
          description: "The IDs of the security group rules.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
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

        const command = new DescribeSecurityGroupRulesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Security Group Rules Result",
      description: "Result from DescribeSecurityGroupRules operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SecurityGroupRules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                SecurityGroupRuleId: {
                  type: "string",
                },
                GroupId: {
                  type: "string",
                },
                GroupOwnerId: {
                  type: "string",
                },
                IsEgress: {
                  type: "boolean",
                },
                IpProtocol: {
                  type: "string",
                },
                FromPort: {
                  type: "number",
                },
                ToPort: {
                  type: "number",
                },
                CidrIpv4: {
                  type: "string",
                },
                CidrIpv6: {
                  type: "string",
                },
                PrefixListId: {
                  type: "string",
                },
                ReferencedGroupInfo: {
                  type: "object",
                  properties: {
                    GroupId: {
                      type: "string",
                    },
                    PeeringStatus: {
                      type: "string",
                    },
                    UserId: {
                      type: "string",
                    },
                    VpcId: {
                      type: "string",
                    },
                    VpcPeeringConnectionId: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                Description: {
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
                SecurityGroupRuleArn: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Information about security group rules.",
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

export default describeSecurityGroupRules;

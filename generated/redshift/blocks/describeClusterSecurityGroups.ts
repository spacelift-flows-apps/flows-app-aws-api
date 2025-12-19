import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeClusterSecurityGroupsCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeClusterSecurityGroups: AppBlock = {
  name: "Describe Cluster Security Groups",
  description: `Returns information about Amazon Redshift security groups.`,
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
        ClusterSecurityGroupName: {
          name: "Cluster Security Group Name",
          description:
            "The name of a cluster security group for which you are requesting details.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of response records to return in each call.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional parameter that specifies the starting point to return a set of response records.",
          type: "string",
          required: false,
        },
        TagKeys: {
          name: "Tag Keys",
          description:
            "A tag key or keys for which you want to return all matching cluster security groups that are associated with the specified key or keys.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        TagValues: {
          name: "Tag Values",
          description:
            "A tag value or values for which you want to return all matching cluster security groups that are associated with the specified tag value or values.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeClusterSecurityGroupsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Cluster Security Groups Result",
      description: "Result from DescribeClusterSecurityGroups operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "A value that indicates the starting point for the next set of response records in a subsequent request.",
          },
          ClusterSecurityGroups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ClusterSecurityGroupName: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                EC2SecurityGroups: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Status: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EC2SecurityGroupName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EC2SecurityGroupOwnerId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Tags: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                IPRanges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Status: {
                        type: "object",
                        additionalProperties: true,
                      },
                      CIDRIP: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Tags: {
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
              },
              additionalProperties: false,
            },
            description: "A list of ClusterSecurityGroup instances.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeClusterSecurityGroups;

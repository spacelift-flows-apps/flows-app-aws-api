import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  DescribeDBSecurityGroupsCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDBSecurityGroups: AppBlock = {
  name: "Describe DB Security Groups",
  description: `Returns a list of DBSecurityGroup descriptions.`,
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
        DBSecurityGroupName: {
          name: "DB Security Group Name",
          description:
            "The name of the DB security group to return details for.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "This parameter isn't currently supported.",
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
              required: ["Name", "Values"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of records to include in the response.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional pagination token provided by a previous DescribeDBSecurityGroups request.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeDBSecurityGroupsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe DB Security Groups Result",
      description: "Result from DescribeDBSecurityGroups operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous request.",
          },
          DBSecurityGroups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                OwnerId: {
                  type: "string",
                },
                DBSecurityGroupName: {
                  type: "string",
                },
                DBSecurityGroupDescription: {
                  type: "string",
                },
                VpcId: {
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
                      EC2SecurityGroupId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EC2SecurityGroupOwnerId: {
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
                    },
                    additionalProperties: false,
                  },
                },
                DBSecurityGroupArn: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of DBSecurityGroup instances.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDBSecurityGroups;

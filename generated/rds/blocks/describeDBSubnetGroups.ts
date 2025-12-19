import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDBSubnetGroups: AppBlock = {
  name: "Describe DB Subnet Groups",
  description: `Returns a list of DBSubnetGroup descriptions.`,
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
        DBSubnetGroupName: {
          name: "DB Subnet Group Name",
          description: "The name of the DB subnet group to return details for.",
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
            "An optional pagination token provided by a previous DescribeDBSubnetGroups request.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeDBSubnetGroupsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe DB Subnet Groups Result",
      description: "Result from DescribeDBSubnetGroups operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous request.",
          },
          DBSubnetGroups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                DBSubnetGroupName: {
                  type: "string",
                },
                DBSubnetGroupDescription: {
                  type: "string",
                },
                VpcId: {
                  type: "string",
                },
                SubnetGroupStatus: {
                  type: "string",
                },
                Subnets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      SubnetIdentifier: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SubnetAvailabilityZone: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SubnetOutpost: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SubnetStatus: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                DBSubnetGroupArn: {
                  type: "string",
                },
                SupportedNetworkTypes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description: "A list of DBSubnetGroup instances.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDBSubnetGroups;

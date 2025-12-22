import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, DescribeOptionGroupsCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeOptionGroups: AppBlock = {
  name: "Describe Option Groups",
  description: `Describes the available option groups.`,
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
        OptionGroupName: {
          name: "Option Group Name",
          description: "The name of the option group to describe.",
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
        Marker: {
          name: "Marker",
          description:
            "An optional pagination token provided by a previous DescribeOptionGroups request.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of records to include in the response.",
          type: "number",
          required: false,
        },
        EngineName: {
          name: "Engine Name",
          description:
            "A filter to only include option groups associated with this database engine.",
          type: "string",
          required: false,
        },
        MajorEngineVersion: {
          name: "Major Engine Version",
          description:
            "Filters the list of option groups to only include groups associated with a specific database engine version.",
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
        }

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeOptionGroupsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Option Groups Result",
      description: "Result from DescribeOptionGroups operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          OptionGroupsList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                OptionGroupName: {
                  type: "string",
                },
                OptionGroupDescription: {
                  type: "string",
                },
                EngineName: {
                  type: "string",
                },
                MajorEngineVersion: {
                  type: "string",
                },
                Options: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      OptionName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      OptionDescription: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Persistent: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Permanent: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Port: {
                        type: "object",
                        additionalProperties: true,
                      },
                      OptionVersion: {
                        type: "object",
                        additionalProperties: true,
                      },
                      OptionSettings: {
                        type: "object",
                        additionalProperties: true,
                      },
                      DBSecurityGroupMemberships: {
                        type: "object",
                        additionalProperties: true,
                      },
                      VpcSecurityGroupMemberships: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                AllowsVpcAndNonVpcInstanceMemberships: {
                  type: "boolean",
                },
                VpcId: {
                  type: "string",
                },
                OptionGroupArn: {
                  type: "string",
                },
                SourceOptionGroup: {
                  type: "string",
                },
                SourceAccountId: {
                  type: "string",
                },
                CopyTimestamp: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "List of option groups.",
          },
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeOptionGroups;

import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  DescribeOptionGroupOptionsCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeOptionGroupOptions: AppBlock = {
  name: "Describe Option Group Options",
  description: `Describes all available options for the specified engine.`,
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
        EngineName: {
          name: "Engine Name",
          description: "The name of the engine to describe options for.",
          type: "string",
          required: true,
        },
        MajorEngineVersion: {
          name: "Major Engine Version",
          description:
            "If specified, filters the results to include only options for the specified major engine version.",
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
            "An optional pagination token provided by a previous request.",
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

        const command = new DescribeOptionGroupOptionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Option Group Options Result",
      description: "Result from DescribeOptionGroupOptions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          OptionGroupOptions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                EngineName: {
                  type: "string",
                },
                MajorEngineVersion: {
                  type: "string",
                },
                MinimumRequiredMinorEngineVersion: {
                  type: "string",
                },
                PortRequired: {
                  type: "boolean",
                },
                DefaultPort: {
                  type: "number",
                },
                OptionsDependedOn: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                OptionsConflictsWith: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                Persistent: {
                  type: "boolean",
                },
                Permanent: {
                  type: "boolean",
                },
                RequiresAutoMinorEngineVersionUpgrade: {
                  type: "boolean",
                },
                VpcOnly: {
                  type: "boolean",
                },
                SupportsOptionVersionDowngrade: {
                  type: "boolean",
                },
                OptionGroupOptionSettings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      SettingName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SettingDescription: {
                        type: "object",
                        additionalProperties: true,
                      },
                      DefaultValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ApplyType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AllowedValues: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IsModifiable: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IsRequired: {
                        type: "object",
                        additionalProperties: true,
                      },
                      MinimumEngineVersionPerAllowedValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                OptionGroupOptionVersions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Version: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IsDefault: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                CopyableCrossAccount: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
            description: "List of available option group options.",
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

export default describeOptionGroupOptions;

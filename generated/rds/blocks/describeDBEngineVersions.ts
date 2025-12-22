import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  DescribeDBEngineVersionsCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDBEngineVersions: AppBlock = {
  name: "Describe DB Engine Versions",
  description: `Describes the properties of specific versions of DB engines.`,
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
        Engine: {
          name: "Engine",
          description: "The database engine to return version details for.",
          type: "string",
          required: false,
        },
        EngineVersion: {
          name: "Engine Version",
          description:
            "A specific database engine version to return details for.",
          type: "string",
          required: false,
        },
        DBParameterGroupFamily: {
          name: "DB Parameter Group Family",
          description:
            "The name of a specific DB parameter group family to return details for.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description:
            "A filter that specifies one or more DB engine versions to describe.",
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
        DefaultOnly: {
          name: "Default Only",
          description:
            "Specifies whether to return only the default version of the specified engine or the engine and major version combination.",
          type: "boolean",
          required: false,
        },
        ListSupportedCharacterSets: {
          name: "List Supported Character Sets",
          description:
            "Specifies whether to list the supported character sets for each engine version.",
          type: "boolean",
          required: false,
        },
        ListSupportedTimezones: {
          name: "List Supported Timezones",
          description:
            "Specifies whether to list the supported time zones for each engine version.",
          type: "boolean",
          required: false,
        },
        IncludeAll: {
          name: "Include All",
          description:
            "Specifies whether to also list the engine versions that aren't available.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeDBEngineVersionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe DB Engine Versions Result",
      description: "Result from DescribeDBEngineVersions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous request.",
          },
          DBEngineVersions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Engine: {
                  type: "string",
                },
                EngineVersion: {
                  type: "string",
                },
                DBParameterGroupFamily: {
                  type: "string",
                },
                DBEngineDescription: {
                  type: "string",
                },
                DBEngineVersionDescription: {
                  type: "string",
                },
                DefaultCharacterSet: {
                  type: "object",
                  properties: {
                    CharacterSetName: {
                      type: "string",
                    },
                    CharacterSetDescription: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                Image: {
                  type: "object",
                  properties: {
                    ImageId: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                DBEngineMediaType: {
                  type: "string",
                },
                SupportedCharacterSets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      CharacterSetName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      CharacterSetDescription: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                SupportedNcharCharacterSets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      CharacterSetName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      CharacterSetDescription: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                ValidUpgradeTarget: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Engine: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EngineVersion: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Description: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AutoUpgrade: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IsMajorVersionUpgrade: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SupportedEngineModes: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SupportsParallelQuery: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SupportsGlobalDatabases: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SupportsBabelfish: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SupportsLimitlessDatabase: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SupportsLocalWriteForwarding: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SupportsIntegrations: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                SupportedTimezones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      TimezoneName: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                ExportableLogTypes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                SupportsLogExportsToCloudwatchLogs: {
                  type: "boolean",
                },
                SupportsReadReplica: {
                  type: "boolean",
                },
                SupportedEngineModes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                SupportedFeatureNames: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                Status: {
                  type: "string",
                },
                SupportsParallelQuery: {
                  type: "boolean",
                },
                SupportsGlobalDatabases: {
                  type: "boolean",
                },
                MajorEngineVersion: {
                  type: "string",
                },
                DatabaseInstallationFilesS3BucketName: {
                  type: "string",
                },
                DatabaseInstallationFilesS3Prefix: {
                  type: "string",
                },
                DBEngineVersionArn: {
                  type: "string",
                },
                KMSKeyId: {
                  type: "string",
                },
                CreateTime: {
                  type: "string",
                },
                TagList: {
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
                SupportsBabelfish: {
                  type: "boolean",
                },
                CustomDBEngineVersionManifest: {
                  type: "string",
                },
                SupportsLimitlessDatabase: {
                  type: "boolean",
                },
                SupportsCertificateRotationWithoutRestart: {
                  type: "boolean",
                },
                SupportedCACertificateIdentifiers: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                SupportsLocalWriteForwarding: {
                  type: "boolean",
                },
                SupportsIntegrations: {
                  type: "boolean",
                },
                ServerlessV2FeaturesSupport: {
                  type: "object",
                  properties: {
                    MinCapacity: {
                      type: "number",
                    },
                    MaxCapacity: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "A list of DBEngineVersion elements.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDBEngineVersions;

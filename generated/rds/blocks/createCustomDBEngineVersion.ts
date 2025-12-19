import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  CreateCustomDBEngineVersionCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createCustomDBEngineVersion: AppBlock = {
  name: "Create Custom DB Engine Version",
  description: `Creates a custom DB engine version (CEV).`,
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
          description: "The database engine.",
          type: "string",
          required: true,
        },
        EngineVersion: {
          name: "Engine Version",
          description: "The name of your CEV.",
          type: "string",
          required: true,
        },
        DatabaseInstallationFilesS3BucketName: {
          name: "Database Installation Files S3Bucket Name",
          description:
            "The name of an Amazon S3 bucket that contains database installation files for your CEV.",
          type: "string",
          required: false,
        },
        DatabaseInstallationFilesS3Prefix: {
          name: "Database Installation Files S3Prefix",
          description:
            "The Amazon S3 directory that contains the database installation files for your CEV.",
          type: "string",
          required: false,
        },
        ImageId: {
          name: "Image Id",
          description: "The ID of the Amazon Machine Image (AMI).",
          type: "string",
          required: false,
        },
        KMSKeyId: {
          name: "KMS Key Id",
          description:
            "The Amazon Web Services KMS key identifier for an encrypted CEV.",
          type: "string",
          required: false,
        },
        Description: {
          name: "Description",
          description: "An optional description of your CEV.",
          type: "string",
          required: false,
        },
        Manifest: {
          name: "Manifest",
          description:
            "The CEV manifest, which is a JSON document that describes the installation .",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "A list of tags.",
          type: {
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
          required: false,
        },
        SourceCustomDbEngineVersionIdentifier: {
          name: "Source Custom Db Engine Version Identifier",
          description:
            "The ARN of a CEV to use as a source for creating a new CEV.",
          type: "string",
          required: false,
        },
        UseAwsProvidedLatestImage: {
          name: "Use Aws Provided Latest Image",
          description:
            "Specifies whether to use the latest service-provided Amazon Machine Image (AMI) for the CEV.",
          type: "boolean",
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

        const command = new CreateCustomDBEngineVersionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Custom DB Engine Version Result",
      description: "Result from CreateCustomDBEngineVersion operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Engine: {
            type: "string",
            description: "The name of the database engine.",
          },
          EngineVersion: {
            type: "string",
            description: "The version number of the database engine.",
          },
          DBParameterGroupFamily: {
            type: "string",
            description:
              "The name of the DB parameter group family for the database engine.",
          },
          DBEngineDescription: {
            type: "string",
            description: "The description of the database engine.",
          },
          DBEngineVersionDescription: {
            type: "string",
            description: "The description of the database engine version.",
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
            description:
              "The default character set for new instances of this engine version, if the CharacterSetName parameter of the CreateDBInstance API isn't specified.",
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
            description: "The EC2 image",
          },
          DBEngineMediaType: {
            type: "string",
            description:
              "A value that indicates the source media provider of the AMI based on the usage operation.",
          },
          SupportedCharacterSets: {
            type: "array",
            items: {
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
            description:
              "A list of the character sets supported by this engine for the CharacterSetName parameter of the CreateDBInstance operation.",
          },
          SupportedNcharCharacterSets: {
            type: "array",
            items: {
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
            description:
              "A list of the character sets supported by the Oracle DB engine for the NcharCharacterSetName parameter of the CreateDBInstance operation.",
          },
          ValidUpgradeTarget: {
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
                Description: {
                  type: "string",
                },
                AutoUpgrade: {
                  type: "boolean",
                },
                IsMajorVersionUpgrade: {
                  type: "boolean",
                },
                SupportedEngineModes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                SupportsParallelQuery: {
                  type: "boolean",
                },
                SupportsGlobalDatabases: {
                  type: "boolean",
                },
                SupportsBabelfish: {
                  type: "boolean",
                },
                SupportsLimitlessDatabase: {
                  type: "boolean",
                },
                SupportsLocalWriteForwarding: {
                  type: "boolean",
                },
                SupportsIntegrations: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of engine versions that this database engine version can be upgraded to.",
          },
          SupportedTimezones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                TimezoneName: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of the time zones supported by this engine for the Timezone parameter of the CreateDBInstance action.",
          },
          ExportableLogTypes: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The types of logs that the database engine has available for export to CloudWatch Logs.",
          },
          SupportsLogExportsToCloudwatchLogs: {
            type: "boolean",
            description:
              "Indicates whether the engine version supports exporting the log types specified by ExportableLogTypes to CloudWatch Logs.",
          },
          SupportsReadReplica: {
            type: "boolean",
            description:
              "Indicates whether the database engine version supports read replicas.",
          },
          SupportedEngineModes: {
            type: "array",
            items: {
              type: "string",
            },
            description: "A list of the supported DB engine modes.",
          },
          SupportedFeatureNames: {
            type: "array",
            items: {
              type: "string",
            },
            description: "A list of features supported by the DB engine.",
          },
          Status: {
            type: "string",
            description:
              "The status of the DB engine version, either available or deprecated.",
          },
          SupportsParallelQuery: {
            type: "boolean",
            description:
              "Indicates whether you can use Aurora parallel query with a specific DB engine version.",
          },
          SupportsGlobalDatabases: {
            type: "boolean",
            description:
              "Indicates whether you can use Aurora global databases with a specific DB engine version.",
          },
          MajorEngineVersion: {
            type: "string",
            description: "The major engine version of the CEV.",
          },
          DatabaseInstallationFilesS3BucketName: {
            type: "string",
            description:
              "The name of the Amazon S3 bucket that contains your database installation files.",
          },
          DatabaseInstallationFilesS3Prefix: {
            type: "string",
            description:
              "The Amazon S3 directory that contains the database installation files.",
          },
          DBEngineVersionArn: {
            type: "string",
            description: "The ARN of the custom engine version.",
          },
          KMSKeyId: {
            type: "string",
            description:
              "The Amazon Web Services KMS key identifier for an encrypted CEV.",
          },
          CreateTime: {
            type: "string",
            description: "The creation time of the DB engine version.",
          },
          TagList: {
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
            description: "A list of tags.",
          },
          SupportsBabelfish: {
            type: "boolean",
            description:
              "Indicates whether the engine version supports Babelfish for Aurora PostgreSQL.",
          },
          CustomDBEngineVersionManifest: {
            type: "string",
            description:
              "JSON string that lists the installation files and parameters that RDS Custom uses to create a custom engine version (CEV).",
          },
          SupportsLimitlessDatabase: {
            type: "boolean",
            description:
              "Indicates whether the DB engine version supports Aurora Limitless Database.",
          },
          SupportsCertificateRotationWithoutRestart: {
            type: "boolean",
            description:
              "Indicates whether the engine version supports rotating the server certificate without rebooting the DB instance.",
          },
          SupportedCACertificateIdentifiers: {
            type: "array",
            items: {
              type: "string",
            },
            description: "A list of the supported CA certificate identifiers.",
          },
          SupportsLocalWriteForwarding: {
            type: "boolean",
            description:
              "Indicates whether the DB engine version supports forwarding write operations from reader DB instances to the writer DB instance in the DB cluster.",
          },
          SupportsIntegrations: {
            type: "boolean",
            description:
              "Indicates whether the DB engine version supports zero-ETL integrations with Amazon Redshift.",
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
            description:
              "Specifies any Aurora Serverless v2 properties or limits that differ between Aurora engine versions.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createCustomDBEngineVersion;

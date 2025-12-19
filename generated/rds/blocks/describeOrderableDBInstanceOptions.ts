import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  DescribeOrderableDBInstanceOptionsCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeOrderableDBInstanceOptions: AppBlock = {
  name: "Describe Orderable DB Instance Options",
  description: `Describes the orderable DB instance options for a specified DB engine.`,
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
          description:
            "The name of the database engine to describe DB instance options for.",
          type: "string",
          required: true,
        },
        EngineVersion: {
          name: "Engine Version",
          description:
            "A filter to include only the available options for the specified engine version.",
          type: "string",
          required: false,
        },
        DBInstanceClass: {
          name: "DB Instance Class",
          description:
            "A filter to include only the available options for the specified DB instance class.",
          type: "string",
          required: false,
        },
        LicenseModel: {
          name: "License Model",
          description:
            "A filter to include only the available options for the specified license model.",
          type: "string",
          required: false,
        },
        AvailabilityZoneGroup: {
          name: "Availability Zone Group",
          description:
            "The Availability Zone group associated with a Local Zone.",
          type: "string",
          required: false,
        },
        Vpc: {
          name: "Vpc",
          description:
            "Specifies whether to show only VPC or non-VPC offerings.",
          type: "boolean",
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
            "An optional pagination token provided by a previous DescribeOrderableDBInstanceOptions request.",
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

        const command = new DescribeOrderableDBInstanceOptionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Orderable DB Instance Options Result",
      description: "Result from DescribeOrderableDBInstanceOptions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          OrderableDBInstanceOptions: {
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
                DBInstanceClass: {
                  type: "string",
                },
                LicenseModel: {
                  type: "string",
                },
                AvailabilityZoneGroup: {
                  type: "string",
                },
                AvailabilityZones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Name: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                MultiAZCapable: {
                  type: "boolean",
                },
                ReadReplicaCapable: {
                  type: "boolean",
                },
                Vpc: {
                  type: "boolean",
                },
                SupportsStorageEncryption: {
                  type: "boolean",
                },
                StorageType: {
                  type: "string",
                },
                SupportsIops: {
                  type: "boolean",
                },
                SupportsEnhancedMonitoring: {
                  type: "boolean",
                },
                SupportsIAMDatabaseAuthentication: {
                  type: "boolean",
                },
                SupportsPerformanceInsights: {
                  type: "boolean",
                },
                MinStorageSize: {
                  type: "number",
                },
                MaxStorageSize: {
                  type: "number",
                },
                MinIopsPerDbInstance: {
                  type: "number",
                },
                MaxIopsPerDbInstance: {
                  type: "number",
                },
                MinIopsPerGib: {
                  type: "number",
                },
                MaxIopsPerGib: {
                  type: "number",
                },
                AvailableProcessorFeatures: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      DefaultValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AllowedValues: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                SupportedEngineModes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                SupportsStorageAutoscaling: {
                  type: "boolean",
                },
                SupportsKerberosAuthentication: {
                  type: "boolean",
                },
                OutpostCapable: {
                  type: "boolean",
                },
                SupportedActivityStreamModes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                SupportsGlobalDatabases: {
                  type: "boolean",
                },
                SupportsClusters: {
                  type: "boolean",
                },
                SupportedNetworkTypes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                SupportsStorageThroughput: {
                  type: "boolean",
                },
                MinStorageThroughputPerDbInstance: {
                  type: "number",
                },
                MaxStorageThroughputPerDbInstance: {
                  type: "number",
                },
                MinStorageThroughputPerIops: {
                  type: "number",
                },
                MaxStorageThroughputPerIops: {
                  type: "number",
                },
                SupportsDedicatedLogVolume: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
            description:
              "An OrderableDBInstanceOption structure containing information about orderable options for the DB instance.",
          },
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous OrderableDBInstanceOptions request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeOrderableDBInstanceOptions;

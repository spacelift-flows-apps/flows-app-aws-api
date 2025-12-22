import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, CreateGlobalClusterCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createGlobalCluster: AppBlock = {
  name: "Create Global Cluster",
  description: `Creates an Aurora global database spread across multiple Amazon Web Services Regions.`,
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
        GlobalClusterIdentifier: {
          name: "Global Cluster Identifier",
          description:
            "The cluster identifier for this global database cluster.",
          type: "string",
          required: false,
        },
        SourceDBClusterIdentifier: {
          name: "Source DB Cluster Identifier",
          description:
            "The Amazon Resource Name (ARN) to use as the primary cluster of the global database.",
          type: "string",
          required: false,
        },
        Engine: {
          name: "Engine",
          description:
            "The database engine to use for this global database cluster.",
          type: "string",
          required: false,
        },
        EngineVersion: {
          name: "Engine Version",
          description:
            "The engine version to use for this global database cluster.",
          type: "string",
          required: false,
        },
        EngineLifecycleSupport: {
          name: "Engine Lifecycle Support",
          description: "The life cycle type for this global database cluster.",
          type: "string",
          required: false,
        },
        DeletionProtection: {
          name: "Deletion Protection",
          description:
            "Specifies whether to enable deletion protection for the new global database cluster.",
          type: "boolean",
          required: false,
        },
        DatabaseName: {
          name: "Database Name",
          description:
            "The name for your database of up to 64 alphanumeric characters.",
          type: "string",
          required: false,
        },
        StorageEncrypted: {
          name: "Storage Encrypted",
          description:
            "Specifies whether to enable storage encryption for the new global database cluster.",
          type: "boolean",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "Tags to assign to the global cluster.",
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

        const command = new CreateGlobalClusterCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Global Cluster Result",
      description: "Result from CreateGlobalCluster operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          GlobalCluster: {
            type: "object",
            properties: {
              GlobalClusterIdentifier: {
                type: "string",
              },
              GlobalClusterResourceId: {
                type: "string",
              },
              GlobalClusterArn: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              Engine: {
                type: "string",
              },
              EngineVersion: {
                type: "string",
              },
              EngineLifecycleSupport: {
                type: "string",
              },
              DatabaseName: {
                type: "string",
              },
              StorageEncrypted: {
                type: "boolean",
              },
              DeletionProtection: {
                type: "boolean",
              },
              GlobalClusterMembers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DBClusterArn: {
                      type: "string",
                    },
                    Readers: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    IsWriter: {
                      type: "boolean",
                    },
                    GlobalWriteForwardingStatus: {
                      type: "string",
                    },
                    SynchronizationStatus: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              Endpoint: {
                type: "string",
              },
              FailoverState: {
                type: "object",
                properties: {
                  Status: {
                    type: "string",
                  },
                  FromDbClusterArn: {
                    type: "string",
                  },
                  ToDbClusterArn: {
                    type: "string",
                  },
                  IsDataLossAllowed: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
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
              },
            },
            additionalProperties: false,
            description: "A data type representing an Aurora global database.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createGlobalCluster;

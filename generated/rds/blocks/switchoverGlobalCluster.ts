import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, SwitchoverGlobalClusterCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const switchoverGlobalCluster: AppBlock = {
  name: "Switchover Global Cluster",
  description: `Switches over the specified secondary DB cluster to be the new primary DB cluster in the global database cluster.`,
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
            "The identifier of the global database cluster to switch over.",
          type: "string",
          required: true,
        },
        TargetDbClusterIdentifier: {
          name: "Target Db Cluster Identifier",
          description:
            "The identifier of the secondary Aurora DB cluster to promote to the new primary for the global database cluster.",
          type: "string",
          required: true,
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

        const command = new SwitchoverGlobalClusterCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Switchover Global Cluster Result",
      description: "Result from SwitchoverGlobalCluster operation",
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

export default switchoverGlobalCluster;

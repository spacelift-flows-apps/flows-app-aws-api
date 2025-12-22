import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, DescribeGlobalClustersCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeGlobalClusters: AppBlock = {
  name: "Describe Global Clusters",
  description: `Returns information about Aurora global database clusters.`,
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
          description: "The user-supplied DB cluster identifier.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description:
            "A filter that specifies one or more global database clusters to describe.",
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
            "An optional pagination token provided by a previous DescribeGlobalClusters request.",
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

        const command = new DescribeGlobalClustersCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Global Clusters Result",
      description: "Result from DescribeGlobalClusters operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous DescribeGlobalClusters request.",
          },
          GlobalClusters: {
            type: "array",
            items: {
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
                        type: "object",
                        additionalProperties: true,
                      },
                      Readers: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IsWriter: {
                        type: "object",
                        additionalProperties: true,
                      },
                      GlobalWriteForwardingStatus: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SynchronizationStatus: {
                        type: "object",
                        additionalProperties: true,
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
            description:
              "The list of global clusters returned by this request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeGlobalClusters;

import { AppBlock, events } from "@slflows/sdk/v1";
import { AthenaClient, CreateWorkGroupCommand } from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createWorkGroup: AppBlock = {
  name: "Create Work Group",
  description: `Creates a workgroup with the specified name.`,
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
        Name: {
          name: "Name",
          description: "The workgroup name.",
          type: "string",
          required: true,
        },
        Configuration: {
          name: "Configuration",
          description:
            "Contains configuration information for creating an Athena SQL workgroup or Spark enabled Athena workgroup.",
          type: {
            type: "object",
            properties: {
              ResultConfiguration: {
                type: "object",
                properties: {
                  OutputLocation: {
                    type: "string",
                  },
                  EncryptionConfiguration: {
                    type: "object",
                    properties: {
                      EncryptionOption: {
                        type: "string",
                      },
                      KmsKey: {
                        type: "string",
                      },
                    },
                    required: ["EncryptionOption"],
                    additionalProperties: false,
                  },
                  ExpectedBucketOwner: {
                    type: "string",
                  },
                  AclConfiguration: {
                    type: "object",
                    properties: {
                      S3AclOption: {
                        type: "string",
                      },
                    },
                    required: ["S3AclOption"],
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              ManagedQueryResultsConfiguration: {
                type: "object",
                properties: {
                  Enabled: {
                    type: "boolean",
                  },
                  EncryptionConfiguration: {
                    type: "object",
                    properties: {
                      KmsKey: {
                        type: "string",
                      },
                    },
                    required: ["KmsKey"],
                    additionalProperties: false,
                  },
                },
                required: ["Enabled"],
                additionalProperties: false,
              },
              EnforceWorkGroupConfiguration: {
                type: "boolean",
              },
              PublishCloudWatchMetricsEnabled: {
                type: "boolean",
              },
              BytesScannedCutoffPerQuery: {
                type: "number",
              },
              RequesterPaysEnabled: {
                type: "boolean",
              },
              EngineVersion: {
                type: "object",
                properties: {
                  SelectedEngineVersion: {
                    type: "string",
                  },
                  EffectiveEngineVersion: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              AdditionalConfiguration: {
                type: "string",
              },
              ExecutionRole: {
                type: "string",
              },
              MonitoringConfiguration: {
                type: "object",
                properties: {
                  CloudWatchLoggingConfiguration: {
                    type: "object",
                    properties: {
                      Enabled: {
                        type: "boolean",
                      },
                      LogGroup: {
                        type: "string",
                      },
                      LogStreamNamePrefix: {
                        type: "string",
                      },
                      LogTypes: {
                        type: "object",
                        additionalProperties: {
                          type: "object",
                        },
                      },
                    },
                    required: ["Enabled"],
                    additionalProperties: false,
                  },
                  ManagedLoggingConfiguration: {
                    type: "object",
                    properties: {
                      Enabled: {
                        type: "boolean",
                      },
                      KmsKey: {
                        type: "string",
                      },
                    },
                    required: ["Enabled"],
                    additionalProperties: false,
                  },
                  S3LoggingConfiguration: {
                    type: "object",
                    properties: {
                      Enabled: {
                        type: "boolean",
                      },
                      KmsKey: {
                        type: "string",
                      },
                      LogLocation: {
                        type: "string",
                      },
                    },
                    required: ["Enabled"],
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              EngineConfiguration: {
                type: "object",
                properties: {
                  CoordinatorDpuSize: {
                    type: "number",
                  },
                  MaxConcurrentDpus: {
                    type: "number",
                  },
                  DefaultExecutorDpuSize: {
                    type: "number",
                  },
                  AdditionalConfigs: {
                    type: "object",
                    additionalProperties: {
                      type: "string",
                    },
                  },
                  SparkProperties: {
                    type: "object",
                    additionalProperties: {
                      type: "string",
                    },
                  },
                  Classifications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Name: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Properties: {
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
              CustomerContentEncryptionConfiguration: {
                type: "object",
                properties: {
                  KmsKey: {
                    type: "string",
                  },
                },
                required: ["KmsKey"],
                additionalProperties: false,
              },
              EnableMinimumEncryptionConfiguration: {
                type: "boolean",
              },
              IdentityCenterConfiguration: {
                type: "object",
                properties: {
                  EnableIdentityCenter: {
                    type: "boolean",
                  },
                  IdentityCenterInstanceArn: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              QueryResultsS3AccessGrantsConfiguration: {
                type: "object",
                properties: {
                  EnableS3AccessGrants: {
                    type: "boolean",
                  },
                  CreateUserLevelPrefix: {
                    type: "boolean",
                  },
                  AuthenticationType: {
                    type: "string",
                  },
                },
                required: ["EnableS3AccessGrants", "AuthenticationType"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        Description: {
          name: "Description",
          description: "The workgroup description.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description:
            "A list of comma separated tags to add to the workgroup that is created.",
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

        const client = new AthenaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateWorkGroupCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Work Group Result",
      description: "Result from CreateWorkGroup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default createWorkGroup;

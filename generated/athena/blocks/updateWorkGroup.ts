import { AppBlock, events } from "@slflows/sdk/v1";
import { AthenaClient, UpdateWorkGroupCommand } from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateWorkGroup: AppBlock = {
  name: "Update Work Group",
  description: `Updates the workgroup with the specified name.`,
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
        WorkGroup: {
          name: "Work Group",
          description: "The specified workgroup that will be updated.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "The workgroup description.",
          type: "string",
          required: false,
        },
        ConfigurationUpdates: {
          name: "Configuration Updates",
          description:
            "Contains configuration updates for an Athena SQL workgroup.",
          type: {
            type: "object",
            properties: {
              EnforceWorkGroupConfiguration: {
                type: "boolean",
              },
              ResultConfigurationUpdates: {
                type: "object",
                properties: {
                  OutputLocation: {
                    type: "string",
                  },
                  RemoveOutputLocation: {
                    type: "boolean",
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
                  RemoveEncryptionConfiguration: {
                    type: "boolean",
                  },
                  ExpectedBucketOwner: {
                    type: "string",
                  },
                  RemoveExpectedBucketOwner: {
                    type: "boolean",
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
                  RemoveAclConfiguration: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              ManagedQueryResultsConfigurationUpdates: {
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
                  RemoveEncryptionConfiguration: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              PublishCloudWatchMetricsEnabled: {
                type: "boolean",
              },
              BytesScannedCutoffPerQuery: {
                type: "number",
              },
              RemoveBytesScannedCutoffPerQuery: {
                type: "boolean",
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
              RemoveCustomerContentEncryptionConfiguration: {
                type: "boolean",
              },
              AdditionalConfiguration: {
                type: "string",
              },
              ExecutionRole: {
                type: "string",
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
            },
            additionalProperties: false,
          },
          required: false,
        },
        State: {
          name: "State",
          description:
            "The workgroup state that will be updated for the given workgroup.",
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

        const client = new AthenaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateWorkGroupCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Work Group Result",
      description: "Result from UpdateWorkGroup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default updateWorkGroup;

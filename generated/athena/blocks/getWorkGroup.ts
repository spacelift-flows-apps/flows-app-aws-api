import { AppBlock, events } from "@slflows/sdk/v1";
import { AthenaClient, GetWorkGroupCommand } from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getWorkGroup: AppBlock = {
  name: "Get Work Group",
  description: `Returns information about the workgroup with the specified name.`,
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
          description: "The name of the workgroup.",
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

        const client = new AthenaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetWorkGroupCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Work Group Result",
      description: "Result from GetWorkGroup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          WorkGroup: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              State: {
                type: "string",
              },
              Configuration: {
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
                            type: "object",
                            additionalProperties: true,
                          },
                          KmsKey: {
                            type: "object",
                            additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
                          },
                          LogGroup: {
                            type: "object",
                            additionalProperties: true,
                          },
                          LogStreamNamePrefix: {
                            type: "object",
                            additionalProperties: true,
                          },
                          LogTypes: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Enabled"],
                        additionalProperties: false,
                      },
                      ManagedLoggingConfiguration: {
                        type: "object",
                        properties: {
                          Enabled: {
                            type: "object",
                            additionalProperties: true,
                          },
                          KmsKey: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Enabled"],
                        additionalProperties: false,
                      },
                      S3LoggingConfiguration: {
                        type: "object",
                        properties: {
                          Enabled: {
                            type: "object",
                            additionalProperties: true,
                          },
                          KmsKey: {
                            type: "object",
                            additionalProperties: true,
                          },
                          LogLocation: {
                            type: "object",
                            additionalProperties: true,
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
                          type: "object",
                        },
                      },
                      SparkProperties: {
                        type: "object",
                        additionalProperties: {
                          type: "object",
                        },
                      },
                      Classifications: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
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
              Description: {
                type: "string",
              },
              CreationTime: {
                type: "string",
              },
              IdentityCenterApplicationArn: {
                type: "string",
              },
            },
            required: ["Name"],
            additionalProperties: false,
            description: "Information about the workgroup.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getWorkGroup;

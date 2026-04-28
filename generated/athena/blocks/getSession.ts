import { AppBlock, events } from "@slflows/sdk/v1";
import { AthenaClient, GetSessionCommand } from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getSession: AppBlock = {
  name: "Get Session",
  description: `Gets the full details of a previously created session, including the session status and configuration.`,
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
        SessionId: {
          name: "Session Id",
          description: "The session ID.",
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

        const command = new GetSessionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Session Result",
      description: "Result from GetSession operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SessionId: {
            type: "string",
            description: "The session ID.",
          },
          Description: {
            type: "string",
            description: "The session description.",
          },
          WorkGroup: {
            type: "string",
            description: "The workgroup to which the session belongs.",
          },
          EngineVersion: {
            type: "string",
            description:
              "The engine version used by the session (for example, PySpark engine version 3).",
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
                      type: "string",
                    },
                    Properties: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description:
              "Contains engine configuration information like DPU usage.",
          },
          NotebookVersion: {
            type: "string",
            description: "The notebook version.",
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
                      type: "array",
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
            description:
              "Contains the configuration settings for managed log persistence, delivering logs to Amazon S3 buckets, Amazon CloudWatch log groups etc.",
          },
          SessionConfiguration: {
            type: "object",
            properties: {
              ExecutionRole: {
                type: "string",
              },
              WorkingDirectory: {
                type: "string",
              },
              IdleTimeoutSeconds: {
                type: "number",
              },
              SessionIdleTimeoutInMinutes: {
                type: "number",
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
            },
            additionalProperties: false,
            description:
              "Contains the workgroup configuration information used by the session.",
          },
          Status: {
            type: "object",
            properties: {
              StartDateTime: {
                type: "string",
              },
              LastModifiedDateTime: {
                type: "string",
              },
              EndDateTime: {
                type: "string",
              },
              IdleSinceDateTime: {
                type: "string",
              },
              State: {
                type: "string",
              },
              StateChangeReason: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Contains information about the status of the session.",
          },
          Statistics: {
            type: "object",
            properties: {
              DpuExecutionInMillis: {
                type: "number",
              },
            },
            additionalProperties: false,
            description: "Contains the DPU execution time.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getSession;

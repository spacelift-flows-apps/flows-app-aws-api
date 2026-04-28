import { AppBlock, events } from "@slflows/sdk/v1";
import { AthenaClient, StartSessionCommand } from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startSession: AppBlock = {
  name: "Start Session",
  description: `Creates a session for running calculations within a workgroup.`,
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
        Description: {
          name: "Description",
          description: "The session description.",
          type: "string",
          required: false,
        },
        WorkGroup: {
          name: "Work Group",
          description: "The workgroup to which the session belongs.",
          type: "string",
          required: true,
        },
        EngineConfiguration: {
          name: "Engine Configuration",
          description:
            "Contains engine data processing unit (DPU) configuration settings and parameter mappings.",
          type: {
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
          },
          required: true,
        },
        ExecutionRole: {
          name: "Execution Role",
          description:
            "The ARN of the execution role used to access user resources for Spark sessions and Identity Center enabled workgroups.",
          type: "string",
          required: false,
        },
        MonitoringConfiguration: {
          name: "Monitoring Configuration",
          description:
            "Contains the configuration settings for managed log persistence, delivering logs to Amazon S3 buckets, Amazon CloudWatch log groups etc.",
          type: {
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
          },
          required: false,
        },
        NotebookVersion: {
          name: "Notebook Version",
          description: "The notebook version.",
          type: "string",
          required: false,
        },
        SessionIdleTimeoutInMinutes: {
          name: "Session Idle Timeout In Minutes",
          description: "The idle timeout in minutes for the session.",
          type: "number",
          required: false,
        },
        ClientRequestToken: {
          name: "Client Request Token",
          description:
            "A unique case-sensitive string used to ensure the request to create the session is idempotent (executes only once).",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description:
            "A list of comma separated tags to add to the session that is created.",
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
        CopyWorkGroupTags: {
          name: "Copy Work Group Tags",
          description:
            "Copies the tags from the Workgroup to the Session when.",
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

        const client = new AthenaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new StartSessionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Session Result",
      description: "Result from StartSession operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SessionId: {
            type: "string",
            description: "The session ID.",
          },
          State: {
            type: "string",
            description: "The state of the session.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startSession;

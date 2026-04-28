import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AthenaClient,
  StartQueryExecutionCommand,
} from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startQueryExecution: AppBlock = {
  name: "Start Query Execution",
  description: `Runs the SQL query statements contained in the Query.`,
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
        QueryString: {
          name: "Query String",
          description: "The SQL query statements to be executed.",
          type: "string",
          required: true,
        },
        ClientRequestToken: {
          name: "Client Request Token",
          description:
            "A unique case-sensitive string used to ensure the request to create the query is idempotent (executes only once).",
          type: "string",
          required: false,
        },
        QueryExecutionContext: {
          name: "Query Execution Context",
          description: "The database within which the query executes.",
          type: {
            type: "object",
            properties: {
              Database: {
                type: "string",
              },
              Catalog: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        ResultConfiguration: {
          name: "Result Configuration",
          description:
            "Specifies information about where and how to save the results of the query execution.",
          type: {
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
          required: false,
        },
        WorkGroup: {
          name: "Work Group",
          description:
            "The name of the workgroup in which the query is being started.",
          type: "string",
          required: false,
        },
        ExecutionParameters: {
          name: "Execution Parameters",
          description: "A list of values for the parameters in a query.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ResultReuseConfiguration: {
          name: "Result Reuse Configuration",
          description:
            "Specifies the query result reuse behavior for the query.",
          type: {
            type: "object",
            properties: {
              ResultReuseByAgeConfiguration: {
                type: "object",
                properties: {
                  Enabled: {
                    type: "boolean",
                  },
                  MaxAgeInMinutes: {
                    type: "number",
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
        EngineConfiguration: {
          name: "Engine Configuration",
          description:
            "The engine configuration for the workgroup, which includes the minimum/maximum number of Data Processing Units (DPU) that queries should use when running in provisioned capacity.",
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

        const command = new StartQueryExecutionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Query Execution Result",
      description: "Result from StartQueryExecution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          QueryExecutionId: {
            type: "string",
            description:
              "The unique ID of the query that ran as a result of this request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startQueryExecution;

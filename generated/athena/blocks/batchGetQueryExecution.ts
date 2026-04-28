import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AthenaClient,
  BatchGetQueryExecutionCommand,
} from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const batchGetQueryExecution: AppBlock = {
  name: "Batch Get Query Execution",
  description: `Returns the details of a single query execution or a list of up to 50 query executions, which you provide as an array of query execution ID strings.`,
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
        QueryExecutionIds: {
          name: "Query Execution Ids",
          description: "An array of query execution IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const command = new BatchGetQueryExecutionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Batch Get Query Execution Result",
      description: "Result from BatchGetQueryExecution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          QueryExecutions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                QueryExecutionId: {
                  type: "string",
                },
                Query: {
                  type: "string",
                },
                StatementType: {
                  type: "string",
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
                ResultReuseConfiguration: {
                  type: "object",
                  properties: {
                    ResultReuseByAgeConfiguration: {
                      type: "object",
                      properties: {
                        Enabled: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MaxAgeInMinutes: {
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
                QueryExecutionContext: {
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
                Status: {
                  type: "object",
                  properties: {
                    State: {
                      type: "string",
                    },
                    StateChangeReason: {
                      type: "string",
                    },
                    SubmissionDateTime: {
                      type: "string",
                    },
                    CompletionDateTime: {
                      type: "string",
                    },
                    AthenaError: {
                      type: "object",
                      properties: {
                        ErrorCategory: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ErrorType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Retryable: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ErrorMessage: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                Statistics: {
                  type: "object",
                  properties: {
                    EngineExecutionTimeInMillis: {
                      type: "number",
                    },
                    DataScannedInBytes: {
                      type: "number",
                    },
                    DataManifestLocation: {
                      type: "string",
                    },
                    TotalExecutionTimeInMillis: {
                      type: "number",
                    },
                    QueryQueueTimeInMillis: {
                      type: "number",
                    },
                    ServicePreProcessingTimeInMillis: {
                      type: "number",
                    },
                    QueryPlanningTimeInMillis: {
                      type: "number",
                    },
                    ServiceProcessingTimeInMillis: {
                      type: "number",
                    },
                    ResultReuseInformation: {
                      type: "object",
                      properties: {
                        ReusedPreviousResult: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["ReusedPreviousResult"],
                      additionalProperties: false,
                    },
                    DpuCount: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                WorkGroup: {
                  type: "string",
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
                ExecutionParameters: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                SubstatementType: {
                  type: "string",
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
            description: "Information about a query execution.",
          },
          UnprocessedQueryExecutionIds: {
            type: "array",
            items: {
              type: "object",
              properties: {
                QueryExecutionId: {
                  type: "string",
                },
                ErrorCode: {
                  type: "string",
                },
                ErrorMessage: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the query executions that failed to run.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default batchGetQueryExecution;

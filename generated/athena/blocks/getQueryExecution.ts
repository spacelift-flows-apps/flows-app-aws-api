import { AppBlock, events } from "@slflows/sdk/v1";
import { AthenaClient, GetQueryExecutionCommand } from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getQueryExecution: AppBlock = {
  name: "Get Query Execution",
  description: `Returns information about a single execution of a query if you have access to the workgroup in which the query ran.`,
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
        QueryExecutionId: {
          name: "Query Execution Id",
          description: "The unique ID of the query execution.",
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

        const command = new GetQueryExecutionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Query Execution Result",
      description: "Result from GetQueryExecution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          QueryExecution: {
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
              ResultReuseConfiguration: {
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
                        type: "number",
                      },
                      ErrorType: {
                        type: "number",
                      },
                      Retryable: {
                        type: "boolean",
                      },
                      ErrorMessage: {
                        type: "string",
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
                        type: "boolean",
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
            description: "Information about the query execution.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getQueryExecution;

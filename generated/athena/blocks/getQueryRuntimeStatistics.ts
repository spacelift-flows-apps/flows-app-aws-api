import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AthenaClient,
  GetQueryRuntimeStatisticsCommand,
} from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getQueryRuntimeStatistics: AppBlock = {
  name: "Get Query Runtime Statistics",
  description: `Returns query execution runtime statistics related to a single execution of a query if you have access to the workgroup in which the query ran.`,
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

        const command = new GetQueryRuntimeStatisticsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Query Runtime Statistics Result",
      description: "Result from GetQueryRuntimeStatistics operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          QueryRuntimeStatistics: {
            type: "object",
            properties: {
              Timeline: {
                type: "object",
                properties: {
                  QueryQueueTimeInMillis: {
                    type: "number",
                  },
                  ServicePreProcessingTimeInMillis: {
                    type: "number",
                  },
                  QueryPlanningTimeInMillis: {
                    type: "number",
                  },
                  EngineExecutionTimeInMillis: {
                    type: "number",
                  },
                  ServiceProcessingTimeInMillis: {
                    type: "number",
                  },
                  TotalExecutionTimeInMillis: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              Rows: {
                type: "object",
                properties: {
                  InputRows: {
                    type: "number",
                  },
                  InputBytes: {
                    type: "number",
                  },
                  OutputBytes: {
                    type: "number",
                  },
                  OutputRows: {
                    type: "number",
                  },
                },
                additionalProperties: false,
              },
              OutputStage: {
                type: "object",
                properties: {
                  StageId: {
                    type: "number",
                  },
                  State: {
                    type: "string",
                  },
                  OutputBytes: {
                    type: "number",
                  },
                  OutputRows: {
                    type: "number",
                  },
                  InputBytes: {
                    type: "number",
                  },
                  InputRows: {
                    type: "number",
                  },
                  ExecutionTime: {
                    type: "number",
                  },
                  QueryStagePlan: {
                    type: "object",
                    properties: {
                      Name: {
                        type: "string",
                      },
                      Identifier: {
                        type: "string",
                      },
                      Children: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      RemoteSources: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                  SubStages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        StageId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        State: {
                          type: "object",
                          additionalProperties: true,
                        },
                        OutputBytes: {
                          type: "object",
                          additionalProperties: true,
                        },
                        OutputRows: {
                          type: "object",
                          additionalProperties: true,
                        },
                        InputBytes: {
                          type: "object",
                          additionalProperties: true,
                        },
                        InputRows: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ExecutionTime: {
                          type: "object",
                          additionalProperties: true,
                        },
                        QueryStagePlan: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SubStages: {
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
            description: "Runtime statistics about the query execution.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getQueryRuntimeStatistics;

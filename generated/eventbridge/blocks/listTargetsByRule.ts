import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EventBridgeClient,
  ListTargetsByRuleCommand,
} from "@aws-sdk/client-eventbridge";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listTargetsByRule: AppBlock = {
  name: "List Targets By Rule",
  description: `Lists the targets assigned to the specified rule.`,
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
        Rule: {
          name: "Rule",
          description: "The name of the rule.",
          type: "string",
          required: true,
        },
        EventBusName: {
          name: "Event Bus Name",
          description:
            "The name or ARN of the event bus associated with the rule.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The token returned by a previous call, which you can use to retrieve the next set of results.",
          type: "string",
          required: false,
        },
        Limit: {
          name: "Limit",
          description: "The maximum number of results to return.",
          type: "number",
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

        const client = new EventBridgeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListTargetsByRuleCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Targets By Rule Result",
      description: "Result from ListTargetsByRule operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Targets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                Arn: {
                  type: "string",
                },
                RoleArn: {
                  type: "string",
                },
                Input: {
                  type: "string",
                },
                InputPath: {
                  type: "string",
                },
                InputTransformer: {
                  type: "object",
                  properties: {
                    InputPathsMap: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                    InputTemplate: {
                      type: "string",
                    },
                  },
                  required: ["InputTemplate"],
                  additionalProperties: false,
                },
                KinesisParameters: {
                  type: "object",
                  properties: {
                    PartitionKeyPath: {
                      type: "string",
                    },
                  },
                  required: ["PartitionKeyPath"],
                  additionalProperties: false,
                },
                RunCommandParameters: {
                  type: "object",
                  properties: {
                    RunCommandTargets: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["RunCommandTargets"],
                  additionalProperties: false,
                },
                EcsParameters: {
                  type: "object",
                  properties: {
                    TaskDefinitionArn: {
                      type: "string",
                    },
                    TaskCount: {
                      type: "number",
                    },
                    LaunchType: {
                      type: "string",
                    },
                    NetworkConfiguration: {
                      type: "object",
                      properties: {
                        awsvpcConfiguration: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    PlatformVersion: {
                      type: "string",
                    },
                    Group: {
                      type: "string",
                    },
                    CapacityProviderStrategy: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    EnableECSManagedTags: {
                      type: "boolean",
                    },
                    EnableExecuteCommand: {
                      type: "boolean",
                    },
                    PlacementConstraints: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    PlacementStrategy: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    PropagateTags: {
                      type: "string",
                    },
                    ReferenceId: {
                      type: "string",
                    },
                    Tags: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["TaskDefinitionArn"],
                  additionalProperties: false,
                },
                BatchParameters: {
                  type: "object",
                  properties: {
                    JobDefinition: {
                      type: "string",
                    },
                    JobName: {
                      type: "string",
                    },
                    ArrayProperties: {
                      type: "object",
                      properties: {
                        Size: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    RetryStrategy: {
                      type: "object",
                      properties: {
                        Attempts: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["JobDefinition", "JobName"],
                  additionalProperties: false,
                },
                SqsParameters: {
                  type: "object",
                  properties: {
                    MessageGroupId: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                HttpParameters: {
                  type: "object",
                  properties: {
                    PathParameterValues: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    HeaderParameters: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                    QueryStringParameters: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                  },
                  additionalProperties: false,
                },
                RedshiftDataParameters: {
                  type: "object",
                  properties: {
                    SecretManagerArn: {
                      type: "string",
                    },
                    Database: {
                      type: "string",
                    },
                    DbUser: {
                      type: "string",
                    },
                    Sql: {
                      type: "string",
                    },
                    StatementName: {
                      type: "string",
                    },
                    WithEvent: {
                      type: "boolean",
                    },
                    Sqls: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["Database"],
                  additionalProperties: false,
                },
                SageMakerPipelineParameters: {
                  type: "object",
                  properties: {
                    PipelineParameterList: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                DeadLetterConfig: {
                  type: "object",
                  properties: {
                    Arn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                RetryPolicy: {
                  type: "object",
                  properties: {
                    MaximumRetryAttempts: {
                      type: "number",
                    },
                    MaximumEventAgeInSeconds: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                AppSyncParameters: {
                  type: "object",
                  properties: {
                    GraphQLOperation: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["Id", "Arn"],
              additionalProperties: false,
            },
            description: "The targets assigned to the rule.",
          },
          NextToken: {
            type: "string",
            description: "A token indicating there are more results available.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listTargetsByRule;

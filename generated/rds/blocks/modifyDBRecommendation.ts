import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, ModifyDBRecommendationCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyDBRecommendation: AppBlock = {
  name: "Modify DB Recommendation",
  description: `Updates the recommendation status and recommended action status for the specified recommendation.`,
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
        RecommendationId: {
          name: "Recommendation Id",
          description: "The identifier of the recommendation to update.",
          type: "string",
          required: true,
        },
        Locale: {
          name: "Locale",
          description: "The language of the modified recommendation.",
          type: "string",
          required: false,
        },
        Status: {
          name: "Status",
          description: "The recommendation status to update.",
          type: "string",
          required: false,
        },
        RecommendedActionUpdates: {
          name: "Recommended Action Updates",
          description: "The list of recommended action status to update.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ActionId: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
              },
              required: ["ActionId", "Status"],
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyDBRecommendationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify DB Recommendation Result",
      description: "Result from ModifyDBRecommendation operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBRecommendation: {
            type: "object",
            properties: {
              RecommendationId: {
                type: "string",
              },
              TypeId: {
                type: "string",
              },
              Severity: {
                type: "string",
              },
              ResourceArn: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              CreatedTime: {
                type: "string",
              },
              UpdatedTime: {
                type: "string",
              },
              Detection: {
                type: "string",
              },
              Recommendation: {
                type: "string",
              },
              Description: {
                type: "string",
              },
              Reason: {
                type: "string",
              },
              RecommendedActions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ActionId: {
                      type: "string",
                    },
                    Title: {
                      type: "string",
                    },
                    Description: {
                      type: "string",
                    },
                    Operation: {
                      type: "string",
                    },
                    Parameters: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    ApplyModes: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Status: {
                      type: "string",
                    },
                    IssueDetails: {
                      type: "object",
                      properties: {
                        PerformanceIssueDetails: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    ContextAttributes: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              Category: {
                type: "string",
              },
              Source: {
                type: "string",
              },
              TypeDetection: {
                type: "string",
              },
              TypeRecommendation: {
                type: "string",
              },
              Impact: {
                type: "string",
              },
              AdditionalInfo: {
                type: "string",
              },
              Links: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Text: {
                      type: "string",
                    },
                    Url: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              IssueDetails: {
                type: "object",
                properties: {
                  PerformanceIssueDetails: {
                    type: "object",
                    properties: {
                      StartTime: {
                        type: "string",
                      },
                      EndTime: {
                        type: "string",
                      },
                      Metrics: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      Analysis: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description:
              "The recommendation for your DB instances, DB clusters, and DB parameter groups.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyDBRecommendation;

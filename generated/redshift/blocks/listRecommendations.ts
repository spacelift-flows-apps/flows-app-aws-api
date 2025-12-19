import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  ListRecommendationsCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listRecommendations: AppBlock = {
  name: "List Recommendations",
  description: `List the Amazon Redshift Advisor recommendations for one or multiple Amazon Redshift clusters in an Amazon Web Services account.`,
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
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description:
            "The unique identifier of the Amazon Redshift cluster for which the list of Advisor recommendations is returned.",
          type: "string",
          required: false,
        },
        NamespaceArn: {
          name: "Namespace Arn",
          description:
            "The Amazon Redshift cluster namespace Amazon Resource Name (ARN) for which the list of Advisor recommendations is returned.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of response records to return in each call.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "A value that indicates the starting point for the next set of response records in a subsequent request.",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
        if (assumeRoleArn) {
          // Use STS to assume the specified role
          const stsClient = new STSClient({
            region: region,
            credentials: {
              accessKeyId: input.app.config.accessKeyId,
              secretAccessKey: input.app.config.secretAccessKey,
              sessionToken: input.app.config.sessionToken,
            },
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListRecommendationsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Recommendations Result",
      description: "Result from ListRecommendations operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                ClusterIdentifier: {
                  type: "string",
                },
                NamespaceArn: {
                  type: "string",
                },
                CreatedAt: {
                  type: "string",
                },
                RecommendationType: {
                  type: "string",
                },
                Title: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                Observation: {
                  type: "string",
                },
                ImpactRanking: {
                  type: "string",
                },
                RecommendationText: {
                  type: "string",
                },
                RecommendedActions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Text: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Database: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Command: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Type: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                ReferenceLinks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Text: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Link: {
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
            description:
              "The Advisor recommendations for action on the Amazon Redshift cluster.",
          },
          Marker: {
            type: "string",
            description:
              "A value that indicates the starting point for the next set of response records in a subsequent request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listRecommendations;

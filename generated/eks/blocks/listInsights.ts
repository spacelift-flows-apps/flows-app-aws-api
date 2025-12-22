import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, ListInsightsCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listInsights: AppBlock = {
  name: "List Insights",
  description: `Returns a list of all insights checked for against the specified cluster.`,
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
        clusterName: {
          name: "cluster Name",
          description:
            "The name of the Amazon EKS cluster associated with the insights.",
          type: "string",
          required: true,
        },
        filter: {
          name: "filter",
          description:
            "The criteria to filter your list of insights for your cluster.",
          type: {
            type: "object",
            properties: {
              categories: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              kubernetesVersions: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              statuses: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of identity provider configurations returned by ListInsights in paginated output.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "The nextToken value returned from a previous paginated ListInsights request.",
          type: "string",
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

        const client = new EKSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListInsightsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Insights Result",
      description: "Result from ListInsights operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                },
                name: {
                  type: "string",
                },
                category: {
                  type: "string",
                },
                kubernetesVersion: {
                  type: "string",
                },
                lastRefreshTime: {
                  type: "string",
                },
                lastTransitionTime: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
                insightStatus: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    reason: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "The returned list of insights.",
          },
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future ListInsights request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listInsights;

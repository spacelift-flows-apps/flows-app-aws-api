import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  CreateUsageLimitCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createUsageLimit: AppBlock = {
  name: "Create Usage Limit",
  description: `Creates a usage limit for a specified Amazon Redshift feature on a cluster.`,
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
            "The identifier of the cluster that you want to limit usage.",
          type: "string",
          required: true,
        },
        FeatureType: {
          name: "Feature Type",
          description: "The Amazon Redshift feature that you want to limit.",
          type: "string",
          required: true,
        },
        LimitType: {
          name: "Limit Type",
          description: "The type of limit.",
          type: "string",
          required: true,
        },
        Amount: {
          name: "Amount",
          description: "The limit amount.",
          type: "number",
          required: true,
        },
        Period: {
          name: "Period",
          description: "The time period that the amount applies to.",
          type: "string",
          required: false,
        },
        BreachAction: {
          name: "Breach Action",
          description:
            "The action that Amazon Redshift takes when the limit is reached.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "A list of tag instances.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateUsageLimitCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Usage Limit Result",
      description: "Result from CreateUsageLimit operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          UsageLimitId: {
            type: "string",
            description: "The identifier of the usage limit.",
          },
          ClusterIdentifier: {
            type: "string",
            description: "The identifier of the cluster with a usage limit.",
          },
          FeatureType: {
            type: "string",
            description:
              "The Amazon Redshift feature to which the limit applies.",
          },
          LimitType: {
            type: "string",
            description: "The type of limit.",
          },
          Amount: {
            type: "number",
            description: "The limit amount.",
          },
          Period: {
            type: "string",
            description: "The time period that the amount applies to.",
          },
          BreachAction: {
            type: "string",
            description:
              "The action that Amazon Redshift takes when the limit is reached.",
          },
          Tags: {
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
            description: "A list of tag instances.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createUsageLimit;

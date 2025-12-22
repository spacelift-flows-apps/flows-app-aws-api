import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECRClient,
  DescribePullThroughCacheRulesCommand,
} from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describePullThroughCacheRules: AppBlock = {
  name: "Describe Pull Through Cache Rules",
  description: `Returns the pull through cache rules for a registry.`,
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
        registryId: {
          name: "registry Id",
          description:
            "The Amazon Web Services account ID associated with the registry to return the pull through cache rules for.",
          type: "string",
          required: false,
        },
        ecrRepositoryPrefixes: {
          name: "ecr Repository Prefixes",
          description:
            "The Amazon ECR repository prefixes associated with the pull through cache rules to return.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "The nextToken value returned from a previous paginated DescribePullThroughCacheRulesRequest request where maxResults was used and the results exceeded the value of that parameter.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of pull through cache rules returned by DescribePullThroughCacheRulesRequest in paginated output.",
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
        }

        const client = new ECRClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribePullThroughCacheRulesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Pull Through Cache Rules Result",
      description: "Result from DescribePullThroughCacheRules operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          pullThroughCacheRules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ecrRepositoryPrefix: {
                  type: "string",
                },
                upstreamRegistryUrl: {
                  type: "string",
                },
                createdAt: {
                  type: "string",
                },
                registryId: {
                  type: "string",
                },
                credentialArn: {
                  type: "string",
                },
                customRoleArn: {
                  type: "string",
                },
                upstreamRepositoryPrefix: {
                  type: "string",
                },
                upstreamRegistry: {
                  type: "string",
                },
                updatedAt: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The details of the pull through cache rules.",
          },
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future DescribePullThroughCacheRulesRequest request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describePullThroughCacheRules;

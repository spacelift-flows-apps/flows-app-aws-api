import { AppBlock, events } from "@slflows/sdk/v1";
import { ECRClient, DescribeRepositoriesCommand } from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeRepositories: AppBlock = {
  name: "Describe Repositories",
  description: `Describes image repositories in a registry.`,
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
            "The Amazon Web Services account ID associated with the registry that contains the repositories to be described.",
          type: "string",
          required: false,
        },
        repositoryNames: {
          name: "repository Names",
          description: "A list of repositories to describe.",
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
            "The nextToken value returned from a previous paginated DescribeRepositories request where maxResults was used and the results exceeded the value of that parameter.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of repository results returned by DescribeRepositories in paginated output.",
          type: "number",
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

        const client = new ECRClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeRepositoriesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Repositories Result",
      description: "Result from DescribeRepositories operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          repositories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                repositoryArn: {
                  type: "string",
                },
                registryId: {
                  type: "string",
                },
                repositoryName: {
                  type: "string",
                },
                repositoryUri: {
                  type: "string",
                },
                createdAt: {
                  type: "string",
                },
                imageTagMutability: {
                  type: "string",
                },
                imageTagMutabilityExclusionFilters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      filterType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      filter: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["filterType", "filter"],
                    additionalProperties: false,
                  },
                },
                imageScanningConfiguration: {
                  type: "object",
                  properties: {
                    scanOnPush: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
                encryptionConfiguration: {
                  type: "object",
                  properties: {
                    encryptionType: {
                      type: "string",
                    },
                    kmsKey: {
                      type: "string",
                    },
                  },
                  required: ["encryptionType"],
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of repository objects corresponding to valid repositories.",
          },
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future DescribeRepositories request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeRepositories;

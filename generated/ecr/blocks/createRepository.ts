import { AppBlock, events } from "@slflows/sdk/v1";
import { ECRClient, CreateRepositoryCommand } from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createRepository: AppBlock = {
  name: "Create Repository",
  description: `Creates a repository.`,
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
            "The Amazon Web Services account ID associated with the registry to create the repository.",
          type: "string",
          required: false,
        },
        repositoryName: {
          name: "repository Name",
          description: "The name to use for the repository.",
          type: "string",
          required: true,
        },
        tags: {
          name: "tags",
          description:
            "The metadata that you apply to the repository to help you categorize and organize them.",
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
              required: ["Key", "Value"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        imageTagMutability: {
          name: "image Tag Mutability",
          description: "The tag mutability setting for the repository.",
          type: "string",
          required: false,
        },
        imageTagMutabilityExclusionFilters: {
          name: "image Tag Mutability Exclusion Filters",
          description:
            "Creates a repository with a list of filters that define which image tags can override the default image tag mutability setting.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                filterType: {
                  type: "string",
                },
                filter: {
                  type: "string",
                },
              },
              required: ["filterType", "filter"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        imageScanningConfiguration: {
          name: "image Scanning Configuration",
          description: "The image scanning configuration for the repository.",
          type: {
            type: "object",
            properties: {
              scanOnPush: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        encryptionConfiguration: {
          name: "encryption Configuration",
          description: "The encryption configuration for the repository.",
          type: {
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

        const command = new CreateRepositoryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Repository Result",
      description: "Result from CreateRepository operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          repository: {
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
                      type: "string",
                    },
                    filter: {
                      type: "string",
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
            description: "The repository that was created.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createRepository;

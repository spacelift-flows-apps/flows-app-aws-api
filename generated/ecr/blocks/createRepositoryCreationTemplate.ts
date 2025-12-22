import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECRClient,
  CreateRepositoryCreationTemplateCommand,
} from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createRepositoryCreationTemplate: AppBlock = {
  name: "Create Repository Creation Template",
  description: `Creates a repository creation template.`,
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
        prefix: {
          name: "prefix",
          description:
            "The repository namespace prefix to associate with the template.",
          type: "string",
          required: true,
        },
        description: {
          name: "description",
          description: "A description for the repository creation template.",
          type: "string",
          required: false,
        },
        encryptionConfiguration: {
          name: "encryption Configuration",
          description:
            "The encryption configuration to use for repositories created using the template.",
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
        resourceTags: {
          name: "resource Tags",
          description:
            "The metadata to apply to the repository to help you categorize and organize.",
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
            "Creates a repository creation template with a list of filters that define which image tags can override the default image tag mutability setting.",
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
        repositoryPolicy: {
          name: "repository Policy",
          description:
            "The repository policy to apply to repositories created using the template.",
          type: "string",
          required: false,
        },
        lifecyclePolicy: {
          name: "lifecycle Policy",
          description:
            "The lifecycle policy to use for repositories created using the template.",
          type: "string",
          required: false,
        },
        appliedFor: {
          name: "applied For",
          description:
            "A list of enumerable strings representing the Amazon ECR repository creation scenarios that this template will apply towards.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        customRoleArn: {
          name: "custom Role Arn",
          description: "The ARN of the role to be assumed by Amazon ECR.",
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

        const client = new ECRClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateRepositoryCreationTemplateCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Repository Creation Template Result",
      description: "Result from CreateRepositoryCreationTemplate operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          registryId: {
            type: "string",
            description: "The registry ID associated with the request.",
          },
          repositoryCreationTemplate: {
            type: "object",
            properties: {
              prefix: {
                type: "string",
              },
              description: {
                type: "string",
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
              resourceTags: {
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
              repositoryPolicy: {
                type: "string",
              },
              lifecyclePolicy: {
                type: "string",
              },
              appliedFor: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              customRoleArn: {
                type: "string",
              },
              createdAt: {
                type: "string",
              },
              updatedAt: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The details of the repository creation template associated with the request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createRepositoryCreationTemplate;

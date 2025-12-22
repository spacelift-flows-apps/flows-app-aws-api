import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECRClient,
  GetLifecyclePolicyPreviewCommand,
} from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getLifecyclePolicyPreview: AppBlock = {
  name: "Get Lifecycle Policy Preview",
  description: `Retrieves the results of the lifecycle policy preview request for the specified repository.`,
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
            "The Amazon Web Services account ID associated with the registry that contains the repository.",
          type: "string",
          required: false,
        },
        repositoryName: {
          name: "repository Name",
          description: "The name of the repository.",
          type: "string",
          required: true,
        },
        imageIds: {
          name: "image Ids",
          description: "The list of imageIDs to be included.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                imageDigest: {
                  type: "string",
                },
                imageTag: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "The nextToken value returned from a previous paginated GetLifecyclePolicyPreviewRequest request where maxResults was used and the results exceeded the value of that parameter.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of repository results returned by GetLifecyclePolicyPreviewRequest in paginated output.",
          type: "number",
          required: false,
        },
        filter: {
          name: "filter",
          description:
            "An optional parameter that filters results based on image tag status and all tags, if tagged.",
          type: {
            type: "object",
            properties: {
              tagStatus: {
                type: "string",
              },
            },
            additionalProperties: false,
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

        const command = new GetLifecyclePolicyPreviewCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Lifecycle Policy Preview Result",
      description: "Result from GetLifecyclePolicyPreview operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          registryId: {
            type: "string",
            description: "The registry ID associated with the request.",
          },
          repositoryName: {
            type: "string",
            description: "The repository name associated with the request.",
          },
          lifecyclePolicyText: {
            type: "string",
            description: "The JSON lifecycle policy text.",
          },
          status: {
            type: "string",
            description: "The status of the lifecycle policy preview request.",
          },
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future GetLifecyclePolicyPreview request.",
          },
          previewResults: {
            type: "array",
            items: {
              type: "object",
              properties: {
                imageTags: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                imageDigest: {
                  type: "string",
                },
                imagePushedAt: {
                  type: "string",
                },
                action: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                appliedRulePriority: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description: "The results of the lifecycle policy preview request.",
          },
          summary: {
            type: "object",
            properties: {
              expiringImageTotalCount: {
                type: "number",
              },
            },
            additionalProperties: false,
            description:
              "The list of images that is returned as a result of the action.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getLifecyclePolicyPreview;

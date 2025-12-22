import { AppBlock, events } from "@slflows/sdk/v1";
import { ECRClient, BatchGetImageCommand } from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const batchGetImage: AppBlock = {
  name: "Batch Get Image",
  description: `Gets detailed information for an image.`,
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
            "The Amazon Web Services account ID associated with the registry that contains the images to describe.",
          type: "string",
          required: false,
        },
        repositoryName: {
          name: "repository Name",
          description: "The repository that contains the images to describe.",
          type: "string",
          required: true,
        },
        imageIds: {
          name: "image Ids",
          description:
            "A list of image ID references that correspond to images to describe.",
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
          required: true,
        },
        acceptedMediaTypes: {
          name: "accepted Media Types",
          description: "The accepted media types for the request.",
          type: {
            type: "array",
            items: {
              type: "string",
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

        const client = new ECRClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new BatchGetImageCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Batch Get Image Result",
      description: "Result from BatchGetImage operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                registryId: {
                  type: "string",
                },
                repositoryName: {
                  type: "string",
                },
                imageId: {
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
                imageManifest: {
                  type: "string",
                },
                imageManifestMediaType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of image objects corresponding to the image references in the request.",
          },
          failures: {
            type: "array",
            items: {
              type: "object",
              properties: {
                imageId: {
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
                failureCode: {
                  type: "string",
                },
                failureReason: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Any failures associated with the call.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default batchGetImage;

import { AppBlock, events } from "@slflows/sdk/v1";
import { ECRClient, BatchDeleteImageCommand } from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const batchDeleteImage: AppBlock = {
  name: "Batch Delete Image",
  description: `Deletes a list of specified images within a repository.`,
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
            "The Amazon Web Services account ID associated with the registry that contains the image to delete.",
          type: "string",
          required: false,
        },
        repositoryName: {
          name: "repository Name",
          description: "The repository that contains the image to delete.",
          type: "string",
          required: true,
        },
        imageIds: {
          name: "image Ids",
          description:
            "A list of image ID references that correspond to images to delete.",
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

        const command = new BatchDeleteImageCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Batch Delete Image Result",
      description: "Result from BatchDeleteImage operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          imageIds: {
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
            description: "The image IDs of the deleted images.",
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

export default batchDeleteImage;

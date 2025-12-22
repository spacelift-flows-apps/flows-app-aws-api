import { AppBlock, events } from "@slflows/sdk/v1";
import { ECRClient, PutImageCommand } from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putImage: AppBlock = {
  name: "Put Image",
  description: `Creates or updates the image manifest and tags associated with an image.`,
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
            "The Amazon Web Services account ID associated with the registry that contains the repository in which to put the image.",
          type: "string",
          required: false,
        },
        repositoryName: {
          name: "repository Name",
          description: "The name of the repository in which to put the image.",
          type: "string",
          required: true,
        },
        imageManifest: {
          name: "image Manifest",
          description:
            "The image manifest corresponding to the image to be uploaded.",
          type: "string",
          required: true,
        },
        imageManifestMediaType: {
          name: "image Manifest Media Type",
          description: "The media type of the image manifest.",
          type: "string",
          required: false,
        },
        imageTag: {
          name: "image Tag",
          description: "The tag to associate with the image.",
          type: "string",
          required: false,
        },
        imageDigest: {
          name: "image Digest",
          description:
            "The image digest of the image manifest corresponding to the image.",
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

        const command = new PutImageCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Image Result",
      description: "Result from PutImage operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          image: {
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
            description: "Details of the image uploaded.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putImage;

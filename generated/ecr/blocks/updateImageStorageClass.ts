import { AppBlock, events } from "@slflows/sdk/v1";
import { ECRClient, UpdateImageStorageClassCommand } from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateImageStorageClass: AppBlock = {
  name: "Update Image Storage Class",
  description: `Transitions an image between storage classes.`,
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
            "The Amazon Web Services account ID associated with the registry that contains the image to transition.",
          type: "string",
          required: false,
        },
        repositoryName: {
          name: "repository Name",
          description:
            "The name of the repository that contains the image to transition.",
          type: "string",
          required: true,
        },
        imageId: {
          name: "image Id",
          description:
            "An object with identifying information for an image in an Amazon ECR repository.",
          type: {
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
          required: true,
        },
        targetStorageClass: {
          name: "target Storage Class",
          description: "The target storage class for the image.",
          type: "string",
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

        const command = new UpdateImageStorageClassCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Image Storage Class Result",
      description: "Result from UpdateImageStorageClass operation",
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
            description:
              "An object with identifying information for an image in an Amazon ECR repository.",
          },
          imageStatus: {
            type: "string",
            description:
              "The current status of the image after the call to UpdateImageStorageClass is complete.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateImageStorageClass;

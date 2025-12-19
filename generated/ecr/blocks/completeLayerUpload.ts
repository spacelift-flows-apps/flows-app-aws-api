import { AppBlock, events } from "@slflows/sdk/v1";
import { ECRClient, CompleteLayerUploadCommand } from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const completeLayerUpload: AppBlock = {
  name: "Complete Layer Upload",
  description: `Informs Amazon ECR that the image layer upload has completed for a specified registry, repository name, and upload ID.`,
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
            "The Amazon Web Services account ID associated with the registry to which to upload layers.",
          type: "string",
          required: false,
        },
        repositoryName: {
          name: "repository Name",
          description:
            "The name of the repository to associate with the image layer.",
          type: "string",
          required: true,
        },
        uploadId: {
          name: "upload Id",
          description:
            "The upload ID from a previous InitiateLayerUpload operation to associate with the image layer.",
          type: "string",
          required: true,
        },
        layerDigests: {
          name: "layer Digests",
          description: "The sha256 digest of the image layer.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
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

        const command = new CompleteLayerUploadCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Complete Layer Upload Result",
      description: "Result from CompleteLayerUpload operation",
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
          uploadId: {
            type: "string",
            description: "The upload ID associated with the layer.",
          },
          layerDigest: {
            type: "string",
            description: "The sha256 digest of the image layer.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default completeLayerUpload;

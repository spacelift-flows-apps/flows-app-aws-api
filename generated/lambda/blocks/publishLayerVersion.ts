import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  PublishLayerVersionCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const publishLayerVersion: AppBlock = {
  name: "Publish Layer Version",
  description: `Creates an Lambda layer from a ZIP archive.`,
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
        LayerName: {
          name: "Layer Name",
          description: "The name or Amazon Resource Name (ARN) of the layer.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "The description of the version.",
          type: "string",
          required: false,
        },
        Content: {
          name: "Content",
          description: "The function layer archive.",
          type: {
            type: "object",
            properties: {
              S3Bucket: {
                type: "string",
              },
              S3Key: {
                type: "string",
              },
              S3ObjectVersion: {
                type: "string",
              },
              ZipFile: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: true,
        },
        CompatibleRuntimes: {
          name: "Compatible Runtimes",
          description: "A list of compatible function runtimes.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        LicenseInfo: {
          name: "License Info",
          description: "The layer's software license.",
          type: "string",
          required: false,
        },
        CompatibleArchitectures: {
          name: "Compatible Architectures",
          description: "A list of compatible instruction set architectures.",
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PublishLayerVersionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Publish Layer Version Result",
      description: "Result from PublishLayerVersion operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Content: {
            type: "object",
            properties: {
              Location: {
                type: "string",
              },
              CodeSha256: {
                type: "string",
              },
              CodeSize: {
                type: "number",
              },
              SigningProfileVersionArn: {
                type: "string",
              },
              SigningJobArn: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Details about the layer version.",
          },
          LayerArn: {
            type: "string",
            description: "The ARN of the layer.",
          },
          LayerVersionArn: {
            type: "string",
            description: "The ARN of the layer version.",
          },
          Description: {
            type: "string",
            description: "The description of the version.",
          },
          CreatedDate: {
            type: "string",
            description:
              "The date that the layer version was created, in ISO-8601 format (YYYY-MM-DDThh:mm:ss.",
          },
          Version: {
            type: "number",
            description: "The version number.",
          },
          CompatibleRuntimes: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The layer's compatible runtimes.",
          },
          LicenseInfo: {
            type: "string",
            description: "The layer's software license.",
          },
          CompatibleArchitectures: {
            type: "array",
            items: {
              type: "string",
            },
            description: "A list of compatible instruction set architectures.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default publishLayerVersion;

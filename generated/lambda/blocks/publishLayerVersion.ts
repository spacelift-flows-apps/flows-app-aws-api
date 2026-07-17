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
              enum: [
                "nodejs",
                "nodejs4.3",
                "nodejs6.10",
                "nodejs8.10",
                "nodejs10.x",
                "nodejs12.x",
                "nodejs14.x",
                "nodejs16.x",
                "java8",
                "java8.al2",
                "java11",
                "python2.7",
                "python3.6",
                "python3.7",
                "python3.8",
                "python3.9",
                "dotnetcore1.0",
                "dotnetcore2.0",
                "dotnetcore2.1",
                "dotnetcore3.1",
                "dotnet6",
                "dotnet8",
                "nodejs4.3-edge",
                "go1.x",
                "ruby2.5",
                "ruby2.7",
                "provided",
                "provided.al2",
                "nodejs18.x",
                "python3.10",
                "java17",
                "ruby3.2",
                "ruby3.3",
                "ruby3.4",
                "python3.11",
                "nodejs20.x",
                "provided.al2023",
                "python3.12",
                "java21",
                "python3.13",
                "nodejs22.x",
                "nodejs24.x",
                "python3.14",
                "java25",
                "dotnet10",
                "ruby4.0",
              ],
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
              enum: ["x86_64", "arm64"],
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
              enum: [
                "nodejs",
                "nodejs4.3",
                "nodejs6.10",
                "nodejs8.10",
                "nodejs10.x",
                "nodejs12.x",
                "nodejs14.x",
                "nodejs16.x",
                "java8",
                "java8.al2",
                "java11",
                "python2.7",
                "python3.6",
                "python3.7",
                "python3.8",
                "python3.9",
                "dotnetcore1.0",
                "dotnetcore2.0",
                "dotnetcore2.1",
                "dotnetcore3.1",
                "dotnet6",
                "dotnet8",
                "nodejs4.3-edge",
                "go1.x",
                "ruby2.5",
                "ruby2.7",
                "provided",
                "provided.al2",
                "nodejs18.x",
                "python3.10",
                "java17",
                "ruby3.2",
                "ruby3.3",
                "ruby3.4",
                "python3.11",
                "nodejs20.x",
                "provided.al2023",
                "python3.12",
                "java21",
                "python3.13",
                "nodejs22.x",
                "nodejs24.x",
                "python3.14",
                "java25",
                "dotnet10",
                "ruby4.0",
              ],
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
              enum: ["x86_64", "arm64"],
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

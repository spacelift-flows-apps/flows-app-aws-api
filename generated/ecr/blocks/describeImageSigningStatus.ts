import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECRClient,
  DescribeImageSigningStatusCommand,
} from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeImageSigningStatus: AppBlock = {
  name: "Describe Image Signing Status",
  description: `Returns the signing status for a specified image.`,
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
        repositoryName: {
          name: "repository Name",
          description: "The name of the repository that contains the image.",
          type: "string",
          required: true,
        },
        imageId: {
          name: "image Id",
          description:
            "An object containing identifying information for an image.",
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
        registryId: {
          name: "registry Id",
          description:
            "The Amazon Web Services account ID associated with the registry that contains the repository.",
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

        const command = new DescribeImageSigningStatusCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Image Signing Status Result",
      description: "Result from DescribeImageSigningStatus operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          repositoryName: {
            type: "string",
            description: "The name of the repository.",
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
              "An object with identifying information for the image.",
          },
          registryId: {
            type: "string",
            description:
              "The Amazon Web Services account ID associated with the registry.",
          },
          signingStatuses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                signingProfileArn: {
                  type: "string",
                },
                failureCode: {
                  type: "string",
                },
                failureReason: {
                  type: "string",
                },
                status: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of signing statuses for the specified image.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeImageSigningStatus;

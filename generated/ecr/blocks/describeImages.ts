import { AppBlock, events } from "@slflows/sdk/v1";
import { ECRClient, DescribeImagesCommand } from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeImages: AppBlock = {
  name: "Describe Images",
  description: `Returns metadata about the images in a repository.`,
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
            "The Amazon Web Services account ID associated with the registry that contains the repository in which to describe images.",
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
          description: "The list of image IDs for the requested repository.",
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
            "The nextToken value returned from a previous paginated DescribeImages request where maxResults was used and the results exceeded the value of that parameter.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of repository results returned by DescribeImages in paginated output.",
          type: "number",
          required: false,
        },
        filter: {
          name: "filter",
          description:
            "The filter key and value with which to filter your DescribeImages results.",
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

        const command = new DescribeImagesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Images Result",
      description: "Result from DescribeImages operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          imageDetails: {
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
                imageDigest: {
                  type: "string",
                },
                imageTags: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                imageSizeInBytes: {
                  type: "number",
                },
                imagePushedAt: {
                  type: "string",
                },
                imageScanStatus: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    description: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                imageScanFindingsSummary: {
                  type: "object",
                  properties: {
                    imageScanCompletedAt: {
                      type: "string",
                    },
                    vulnerabilitySourceUpdatedAt: {
                      type: "string",
                    },
                    findingSeverityCounts: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                  },
                  additionalProperties: false,
                },
                imageManifestMediaType: {
                  type: "string",
                },
                artifactMediaType: {
                  type: "string",
                },
                lastRecordedPullTime: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of ImageDetail objects that contain data about the image.",
          },
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future DescribeImages request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeImages;

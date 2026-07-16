import { AppBlock, events } from "@slflows/sdk/v1";
import { ECRClient, ListImageReferrersCommand } from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listImageReferrers: AppBlock = {
  name: "List Image Referrers",
  description: `Lists the artifacts associated with a specified subject image.`,
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
            "The Amazon Web Services account ID associated with the registry that contains the repository in which to list image referrers.",
          type: "string",
          required: false,
        },
        repositoryName: {
          name: "repository Name",
          description:
            "The name of the repository that contains the subject image.",
          type: "string",
          required: true,
        },
        subjectId: {
          name: "subject Id",
          description:
            "An object containing the image digest of the subject image for which to retrieve associated artifacts.",
          type: {
            type: "object",
            properties: {
              imageDigest: {
                type: "string",
              },
            },
            required: ["imageDigest"],
            additionalProperties: false,
          },
          required: true,
        },
        filter: {
          name: "filter",
          description:
            "The filter key and value with which to filter your ListImageReferrers results.",
          type: {
            type: "object",
            properties: {
              artifactTypes: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              artifactStatus: {
                type: "string",
                enum: ["ACTIVE", "ARCHIVED", "ACTIVATING", "ANY"],
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "The nextToken value returned from a previous paginated ListImageReferrers request where maxResults was used and the results exceeded the value of that parameter.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of image referrer results returned by ListImageReferrers in paginated output.",
          type: "number",
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

        const command = new ListImageReferrersCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Image Referrers Result",
      description: "Result from ListImageReferrers operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          referrers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                digest: {
                  type: "string",
                },
                mediaType: {
                  type: "string",
                },
                artifactType: {
                  type: "string",
                },
                size: {
                  type: "number",
                },
                annotations: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
                artifactStatus: {
                  type: "string",
                  enum: ["ACTIVE", "ARCHIVED", "ACTIVATING"],
                },
              },
              required: ["digest", "mediaType", "size"],
              additionalProperties: false,
            },
            description:
              "The list of artifacts associated with the subject image.",
          },
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future ListImageReferrers request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listImageReferrers;

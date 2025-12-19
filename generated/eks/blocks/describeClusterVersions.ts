import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, DescribeClusterVersionsCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeClusterVersions: AppBlock = {
  name: "Describe Cluster Versions",
  description: `Lists available Kubernetes versions for Amazon EKS clusters.`,
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
        clusterType: {
          name: "cluster Type",
          description: "The type of cluster to filter versions by.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description: "Maximum number of results to return.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "Pagination token for the next set of results.",
          type: "string",
          required: false,
        },
        defaultOnly: {
          name: "default Only",
          description: "Filter to show only default versions.",
          type: "boolean",
          required: false,
        },
        includeAll: {
          name: "include All",
          description: "Include all available versions in the response.",
          type: "boolean",
          required: false,
        },
        clusterVersions: {
          name: "cluster Versions",
          description: "List of specific cluster versions to describe.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        status: {
          name: "status",
          description: "This field is deprecated.",
          type: "string",
          required: false,
        },
        versionStatus: {
          name: "version Status",
          description: "Filter versions by their current status.",
          type: "string",
          required: false,
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

        const client = new EKSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeClusterVersionsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Cluster Versions Result",
      description: "Result from DescribeClusterVersions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          nextToken: {
            type: "string",
            description: "Pagination token for the next set of results.",
          },
          clusterVersions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                clusterVersion: {
                  type: "string",
                },
                clusterType: {
                  type: "string",
                },
                defaultPlatformVersion: {
                  type: "string",
                },
                defaultVersion: {
                  type: "boolean",
                },
                releaseDate: {
                  type: "string",
                },
                endOfStandardSupportDate: {
                  type: "string",
                },
                endOfExtendedSupportDate: {
                  type: "string",
                },
                status: {
                  type: "string",
                },
                versionStatus: {
                  type: "string",
                },
                kubernetesPatchVersion: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "List of cluster version information objects.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeClusterVersions;

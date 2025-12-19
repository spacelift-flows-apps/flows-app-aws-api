import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, DescribeAddonVersionsCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAddonVersions: AppBlock = {
  name: "Describe Addon Versions",
  description: `Describes the versions for an add-on.`,
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
        kubernetesVersion: {
          name: "kubernetes Version",
          description:
            "The Kubernetes versions that you can use the add-on with.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of results, returned in paginated output.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "The nextToken value returned from a previous paginated request, where maxResults was used and the results exceeded the value of that parameter.",
          type: "string",
          required: false,
        },
        addonName: {
          name: "addon Name",
          description: "The name of the add-on.",
          type: "string",
          required: false,
        },
        types: {
          name: "types",
          description: "The type of the add-on.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        publishers: {
          name: "publishers",
          description: "The publisher of the add-on.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        owners: {
          name: "owners",
          description: "The owner of the add-on.",
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

        const command = new DescribeAddonVersionsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Addon Versions Result",
      description: "Result from DescribeAddonVersions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          addons: {
            type: "array",
            items: {
              type: "object",
              properties: {
                addonName: {
                  type: "string",
                },
                type: {
                  type: "string",
                },
                addonVersions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      addonVersion: {
                        type: "object",
                        additionalProperties: true,
                      },
                      architecture: {
                        type: "object",
                        additionalProperties: true,
                      },
                      computeTypes: {
                        type: "object",
                        additionalProperties: true,
                      },
                      compatibilities: {
                        type: "object",
                        additionalProperties: true,
                      },
                      requiresConfiguration: {
                        type: "object",
                        additionalProperties: true,
                      },
                      requiresIamPermissions: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                publisher: {
                  type: "string",
                },
                owner: {
                  type: "string",
                },
                marketplaceInformation: {
                  type: "object",
                  properties: {
                    productId: {
                      type: "string",
                    },
                    productUrl: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description:
              "The list of available versions with Kubernetes version compatibility and other properties.",
          },
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future DescribeAddonVersions request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeAddonVersions;

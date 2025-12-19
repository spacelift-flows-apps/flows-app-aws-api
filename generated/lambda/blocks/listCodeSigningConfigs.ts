import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  ListCodeSigningConfigsCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listCodeSigningConfigs: AppBlock = {
  name: "List Code Signing Configs",
  description: `Returns a list of code signing configurations.`,
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
        Marker: {
          name: "Marker",
          description:
            "Specify the pagination token that's returned by a previous request to retrieve the next page of results.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description: "Maximum number of items to return.",
          type: "number",
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListCodeSigningConfigsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Code Signing Configs Result",
      description: "Result from ListCodeSigningConfigs operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextMarker: {
            type: "string",
            description:
              "The pagination token that's included if more results are available.",
          },
          CodeSigningConfigs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CodeSigningConfigId: {
                  type: "string",
                },
                CodeSigningConfigArn: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                AllowedPublishers: {
                  type: "object",
                  properties: {
                    SigningProfileVersionArns: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["SigningProfileVersionArns"],
                  additionalProperties: false,
                },
                CodeSigningPolicies: {
                  type: "object",
                  properties: {
                    UntrustedArtifactOnDeployment: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                LastModified: {
                  type: "string",
                },
              },
              required: [
                "CodeSigningConfigId",
                "CodeSigningConfigArn",
                "AllowedPublishers",
                "CodeSigningPolicies",
                "LastModified",
              ],
              additionalProperties: false,
            },
            description: "The code signing configurations",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listCodeSigningConfigs;

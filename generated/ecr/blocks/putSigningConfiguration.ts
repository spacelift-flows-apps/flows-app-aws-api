import { AppBlock, events } from "@slflows/sdk/v1";
import { ECRClient, PutSigningConfigurationCommand } from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putSigningConfiguration: AppBlock = {
  name: "Put Signing Configuration",
  description: `Creates or updates the registry's signing configuration, which defines rules for automatically signing images with Amazon Web Services Signer.`,
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
        signingConfiguration: {
          name: "signing Configuration",
          description: "The signing configuration to assign to the registry.",
          type: {
            type: "object",
            properties: {
              rules: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    signingProfileArn: {
                      type: "string",
                    },
                    repositoryFilters: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          filter: {},
                          filterType: {},
                        },
                        required: ["filter", "filterType"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["signingProfileArn"],
                  additionalProperties: false,
                },
              },
            },
            required: ["rules"],
            additionalProperties: false,
          },
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

        const command = new PutSigningConfigurationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Signing Configuration Result",
      description: "Result from PutSigningConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          signingConfiguration: {
            type: "object",
            properties: {
              rules: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    signingProfileArn: {
                      type: "string",
                    },
                    repositoryFilters: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          filter: {},
                          filterType: {},
                        },
                        required: ["filter", "filterType"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["signingProfileArn"],
                  additionalProperties: false,
                },
              },
            },
            required: ["rules"],
            additionalProperties: false,
            description: "The registry's updated signing configuration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putSigningConfiguration;

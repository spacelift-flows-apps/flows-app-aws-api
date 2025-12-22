import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  UpdateCodeSigningConfigCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateCodeSigningConfig: AppBlock = {
  name: "Update Code Signing Config",
  description: `Update the code signing configuration.`,
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
        CodeSigningConfigArn: {
          name: "Code Signing Config Arn",
          description:
            "The The Amazon Resource Name (ARN) of the code signing configuration.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "Descriptive name for this code signing configuration.",
          type: "string",
          required: false,
        },
        AllowedPublishers: {
          name: "Allowed Publishers",
          description: "Signing profiles for this code signing configuration.",
          type: {
            type: "object",
            properties: {
              SigningProfileVersionArns: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            required: ["SigningProfileVersionArns"],
            additionalProperties: false,
          },
          required: false,
        },
        CodeSigningPolicies: {
          name: "Code Signing Policies",
          description: "The code signing policy.",
          type: {
            type: "object",
            properties: {
              UntrustedArtifactOnDeployment: {
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

        const command = new UpdateCodeSigningConfigCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Code Signing Config Result",
      description: "Result from UpdateCodeSigningConfig operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CodeSigningConfig: {
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
                      type: "string",
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
            description: "The code signing configuration",
          },
        },
        required: ["CodeSigningConfig"],
      },
    },
  },
};

export default updateCodeSigningConfig;

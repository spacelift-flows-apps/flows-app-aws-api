import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  GetCodeSigningConfigCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getCodeSigningConfig: AppBlock = {
  name: "Get Code Signing Config",
  description: `Returns information about the specified code signing configuration.`,
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

        const command = new GetCodeSigningConfigCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Code Signing Config Result",
      description: "Result from GetCodeSigningConfig operation",
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

export default getCodeSigningConfig;

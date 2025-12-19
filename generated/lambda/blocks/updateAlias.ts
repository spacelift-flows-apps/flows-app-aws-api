import { AppBlock, events } from "@slflows/sdk/v1";
import { LambdaClient, UpdateAliasCommand } from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateAlias: AppBlock = {
  name: "Update Alias",
  description: `Updates the configuration of a Lambda function alias.`,
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
        FunctionName: {
          name: "Function Name",
          description: "The name or ARN of the Lambda function.",
          type: "string",
          required: true,
        },
        Name: {
          name: "Name",
          description: "The name of the alias.",
          type: "string",
          required: true,
        },
        FunctionVersion: {
          name: "Function Version",
          description: "The function version that the alias invokes.",
          type: "string",
          required: false,
        },
        Description: {
          name: "Description",
          description: "A description of the alias.",
          type: "string",
          required: false,
        },
        RoutingConfig: {
          name: "Routing Config",
          description: "The routing configuration of the alias.",
          type: {
            type: "object",
            properties: {
              AdditionalVersionWeights: {
                type: "object",
                additionalProperties: {
                  type: "number",
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        RevisionId: {
          name: "Revision Id",
          description:
            "Only update the alias if the revision ID matches the ID that's specified.",
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateAliasCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Alias Result",
      description: "Result from UpdateAlias operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AliasArn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the alias.",
          },
          Name: {
            type: "string",
            description: "The name of the alias.",
          },
          FunctionVersion: {
            type: "string",
            description: "The function version that the alias invokes.",
          },
          Description: {
            type: "string",
            description: "A description of the alias.",
          },
          RoutingConfig: {
            type: "object",
            properties: {
              AdditionalVersionWeights: {
                type: "object",
                additionalProperties: {
                  type: "number",
                },
              },
            },
            additionalProperties: false,
            description: "The routing configuration of the alias.",
          },
          RevisionId: {
            type: "string",
            description:
              "A unique identifier that changes when you update the alias.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateAlias;

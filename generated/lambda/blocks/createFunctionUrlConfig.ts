import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  CreateFunctionUrlConfigCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createFunctionUrlConfig: AppBlock = {
  name: "Create Function Url Config",
  description: `Creates a Lambda function URL with the specified configuration parameters.`,
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
        Qualifier: {
          name: "Qualifier",
          description: "The alias name.",
          type: "string",
          required: false,
        },
        AuthType: {
          name: "Auth Type",
          description:
            "The type of authentication that your function URL uses.",
          type: "string",
          required: true,
        },
        Cors: {
          name: "Cors",
          description:
            "The cross-origin resource sharing (CORS) settings for your function URL.",
          type: {
            type: "object",
            properties: {
              AllowCredentials: {
                type: "boolean",
              },
              AllowHeaders: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              AllowMethods: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              AllowOrigins: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              ExposeHeaders: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              MaxAge: {
                type: "number",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        InvokeMode: {
          name: "Invoke Mode",
          description:
            "Use one of the following options: BUFFERED – This is the default option.",
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

        const command = new CreateFunctionUrlConfigCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Function Url Config Result",
      description: "Result from CreateFunctionUrlConfig operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          FunctionUrl: {
            type: "string",
            description: "The HTTP URL endpoint for your function.",
          },
          FunctionArn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of your function.",
          },
          AuthType: {
            type: "string",
            description:
              "The type of authentication that your function URL uses.",
          },
          Cors: {
            type: "object",
            properties: {
              AllowCredentials: {
                type: "boolean",
              },
              AllowHeaders: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              AllowMethods: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              AllowOrigins: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              ExposeHeaders: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              MaxAge: {
                type: "number",
              },
            },
            additionalProperties: false,
            description:
              "The cross-origin resource sharing (CORS) settings for your function URL.",
          },
          CreationTime: {
            type: "string",
            description:
              "When the function URL was created, in ISO-8601 format (YYYY-MM-DDThh:mm:ss.",
          },
          InvokeMode: {
            type: "string",
            description:
              "Use one of the following options: BUFFERED – This is the default option.",
          },
        },
        required: ["FunctionUrl", "FunctionArn", "AuthType", "CreationTime"],
      },
    },
  },
};

export default createFunctionUrlConfig;

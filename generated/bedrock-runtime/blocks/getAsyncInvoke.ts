import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BedrockRuntimeClient,
  GetAsyncInvokeCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getAsyncInvoke: AppBlock = {
  name: "Get Async Invoke",
  description: `Retrieve information about an asynchronous invocation.`,
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
        invocationArn: {
          name: "invocation Arn",
          description: "The invocation's ARN.",
          type: "string",
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

        const client = new BedrockRuntimeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetAsyncInvokeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Async Invoke Result",
      description: "Result from GetAsyncInvoke operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          invocationArn: {
            type: "string",
            description: "The invocation's ARN.",
          },
          modelArn: {
            type: "string",
            description: "The invocation's model ARN.",
          },
          clientRequestToken: {
            type: "string",
            description: "The invocation's idempotency token.",
          },
          status: {
            type: "string",
            description: "The invocation's status.",
          },
          failureMessage: {
            type: "string",
            description: "An error message.",
          },
          submitTime: {
            type: "string",
            description: "When the invocation request was submitted.",
          },
          lastModifiedTime: {
            type: "string",
            description: "The invocation's last modified time.",
          },
          endTime: {
            type: "string",
            description: "When the invocation ended.",
          },
          outputDataConfig: {
            oneOf: [
              {
                type: "object",
                properties: {
                  s3OutputDataConfig: {
                    type: "object",
                    properties: {
                      s3Uri: {
                        type: "string",
                      },
                      kmsKeyId: {
                        type: "string",
                      },
                      bucketOwner: {
                        type: "string",
                      },
                    },
                    required: ["s3Uri"],
                    additionalProperties: false,
                  },
                },
                required: ["s3OutputDataConfig"],
                additionalProperties: false,
              },
            ],
            description: "Output data settings.",
          },
        },
        required: [
          "invocationArn",
          "modelArn",
          "status",
          "submitTime",
          "outputDataConfig",
        ],
      },
    },
  },
};

export default getAsyncInvoke;

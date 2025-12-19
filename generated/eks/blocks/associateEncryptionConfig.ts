import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EKSClient,
  AssociateEncryptionConfigCommand,
} from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const associateEncryptionConfig: AppBlock = {
  name: "Associate Encryption Config",
  description: `Associates an encryption configuration to an existing cluster.`,
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
        clusterName: {
          name: "cluster Name",
          description: "The name of your cluster.",
          type: "string",
          required: true,
        },
        encryptionConfig: {
          name: "encryption Config",
          description: "The configuration you are using for encryption.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                resources: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                provider: {
                  type: "object",
                  properties: {
                    keyArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
          },
          required: true,
        },
        clientRequestToken: {
          name: "client Request Token",
          description:
            "A unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
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

        const command = new AssociateEncryptionConfigCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Associate Encryption Config Result",
      description: "Result from AssociateEncryptionConfig operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          update: {
            type: "object",
            properties: {
              id: {
                type: "string",
              },
              status: {
                type: "string",
              },
              type: {
                type: "string",
              },
              params: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                    },
                    value: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              createdAt: {
                type: "string",
              },
              errors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    errorCode: {
                      type: "string",
                    },
                    errorMessage: {
                      type: "string",
                    },
                    resourceIds: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description: "An object representing an asynchronous update.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default associateEncryptionConfig;

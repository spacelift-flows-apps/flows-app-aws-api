import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, CreateGrantCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createGrant: AppBlock = {
  name: "Create Grant",
  description: `Adds a grant to a KMS key.`,
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
        KeyId: {
          name: "Key Id",
          description: "Identifies the KMS key for the grant.",
          type: "string",
          required: true,
        },
        GranteePrincipal: {
          name: "Grantee Principal",
          description:
            "The identity that gets the permissions specified in the grant.",
          type: "string",
          required: true,
        },
        RetiringPrincipal: {
          name: "Retiring Principal",
          description:
            "The principal that has permission to use the RetireGrant operation to retire the grant.",
          type: "string",
          required: false,
        },
        Operations: {
          name: "Operations",
          description: "A list of operations that the grant permits.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        Constraints: {
          name: "Constraints",
          description: "Specifies a grant constraint.",
          type: {
            type: "object",
            properties: {
              EncryptionContextSubset: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
              EncryptionContextEquals: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        GrantTokens: {
          name: "Grant Tokens",
          description: "A list of grant tokens.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Name: {
          name: "Name",
          description: "A friendly name for the grant.",
          type: "string",
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description: "Checks if your request will succeed.",
          type: "boolean",
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

        const client = new KMSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateGrantCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Grant Result",
      description: "Result from CreateGrant operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          GrantToken: {
            type: "string",
            description: "The grant token.",
          },
          GrantId: {
            type: "string",
            description: "The unique identifier for the grant.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createGrant;
